import { useState, useRef, useEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator, // เพิ่ม ActivityIndicator สำหรับแสดงสถานะ Loading
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
// NOTE: For security reasons, the API key should ideally be managed securely.
import { GoogleGenAI } from "@google/genai";
import getPrompt from "../utils/getPrompt";
import AiAvatar from '../assets/icon-chat.png';

// เปลี่ยนข้อความเริ่มต้นสำหรับ FruitGuruAI
export const initialMessageHistory = [
  {
    id: "default",
    text: `สวัสดีครับ! ผมคือ FruitGuruAI ผู้เชี่ยวชาญด้านผลไม้เขตร้อนและผลไม้แปลกใหม่ครับ 🥭
คุณสนใจจะค้นหาข้อมูลเชิงลึกเกี่ยวกับผลไม้ชนิดไหนเป็นพิเศษไหมครับ? หรืออยากรู้แค่ประโยชน์ต่อสุขภาพของผลไม้ชนิดใด?`,
    sender: "model",
  },
];

const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
});

export default function ChatScreen() {
  const [messageHistory, setMessageHistory] = useState(initialMessageHistory);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State สำหรับ loading

  async function handleSendMessage() {
    // ถ้าไม่มีข้อความจากผู้ใช้ให้ออกจาก function
    if (!message || isLoading) return;

    const userMessage = {
      id: uuid.v4(),
      text: message.trim(),
      sender: "user",
    };

    // อัปเดต UI ทันทีด้วยข้อความผู้ใช้
    setMessageHistory((prev) => [...prev, userMessage]);
    const currentMessage = message.trim();
    setMessage(""); // ล้าง input ทันที
    setIsLoading(true);

    try {
      // สำหรับการส่งประวัติทั้งหมดไปยัง LLM ต้องจัดรูปแบบ contents ให้ถูกต้อง
      // เราต้องรวมประวัติทั้งหมดเข้าด้วยกันในรูปแบบที่ LLM เข้าใจ
      const formattedHistory = messageHistory.map((msg) => ({
        role: msg.sender,
        parts: [{ text: msg.text }],
      }));
      // เพิ่มข้อความปัจจุบันของผู้ใช้เข้าไปใน history สำหรับส่ง API
      formattedHistory.push({
        role: "user",
        parts: [{ text: currentMessage }],
      });

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        // ส่งประวัติทั้งหมด, รวมถึงข้อความล่าสุดของผู้ใช้
        contents: formattedHistory,
        config: {
          // ใช้ getPrompt ที่อัปเดตแล้ว (ซึ่งตอนนี้ใช้ FruitGuruAI persona)
          systemInstruction: getPrompt(messageHistory),
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              text: { type: "STRING" }, // ข้อความหลักหรือรายงานผลไม้
              sender: {
                type: "STRING",
                enum: ["model"],
              },
            },
            // ลบ properties 'technologies' ออกแล้ว
            required: ["id", "text", "sender"],
          },
        },
      });

      // ตรวจสอบและ Parse JSON
      let modelMessage;
      try {
        const jsonString = res.text.trim();
        modelMessage = JSON.parse(jsonString);
      } catch (e) {
        // หาก JSON parsing ล้มเหลว (โมเดลตอบกลับเป็น Plain Text)
        console.error("Failed to parse JSON response:", res.text, e);
        modelMessage = {
          id: uuid.v4(),
          text: "ขออภัยครับ เกิดข้อผิดพลาดในการสร้างคำตอบ กรุณาลองถามคำถามอีกครั้ง.",
          sender: "model",
        };
      }

      // เพิ่มข้อความจาก Model เข้าไปใน History
      setMessageHistory((prev) => [...prev, modelMessage]);
    } catch (err) {
      console.error("API Call Error:", err);
      // แสดงข้อความ error
      setMessageHistory((prev) => [
        ...prev,
        {
          id: uuid.v4(),
          text: `เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: ${
            err.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้"
          }`,
          sender: "model",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // ฟังก์ชันสำหรับ Scroll FlatList ไปด้านล่างสุดเมื่อมีข้อความใหม่
  const flatListRef = useRef(null);
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messageHistory]);

  return (
    <SafeAreaView style={styles.container}>

      {/* Message container */}
      <FlatList
        ref={flatListRef}
        style={styles.messageContainer}
        data={messageHistory}
        contentContainerStyle={{ rowGap: 20 }}
        ListFooterComponent={() =>
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#475569" />
              <Text style={styles.loadingText}>FruitGuruAI กำลังคิดอยู่...</Text>
            </View>
          ) : (
            <View style={{ paddingBottom: 20 }} />
          )
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isModelMessage = item.sender === "model";
          return (
            <View
              key={item.id}
              style={[
                styles.messageItem,
                isModelMessage
                  ? { justifyContent: "flex-start" }
                  : { justifyContent: "flex-end" },
              ]}
            >
              {/* Avatar ของ Model (ด้านซ้าย) */}
              {isModelMessage && (
                <Image
                  source={AiAvatar}
                  style={styles.avatar}
                />
              )}

              {/* ข้อความ (Model และ User) */}
              <Text
                style={[
                  styles.message,
                  {
                    backgroundColor: isModelMessage ? "#fafafa" : "#fafafa",
                    alignSelf: isModelMessage ? "flex-start" : "flex-end",
                  },
                ]}
              >
                {item.text}
              </Text>
            </View>
          );
        }}
      />

      {/* Message input */}
      <View style={styles.inputContainer}>
        <View style={{ position: "relative" }}>
          <TextInput
            style={styles.input}
            placeholderTextColor={"#a1a1aa"} // ปรับสี placeholder ให้เข้ากับพื้นหลัง
            placeholder="ถาม FruitGuruAI เกี่ยวกับผลไม้ที่คุณสนใจ..."
            value={message}
            onChangeText={setMessage}
            editable={!isLoading} // ปิดการแก้ไขขณะโหลด
          />
          <TouchableOpacity
            style={[
              styles.button,
              { opacity: message.trim().length === 0 || isLoading ? 0.5 : 1 },
            ]}
            onPress={handleSendMessage}
            disabled={message.trim().length === 0 || isLoading}
          >
            <Text style={styles.text}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  avatar: {
    width: 32, // ปรับขนาด avatar เล็กน้อยเพื่อให้มีที่ว่างมากขึ้น
    height: 32,
    borderRadius: 999,
  },
  title: {
    color: "#fafafa",
    fontWeight: "bold",
    fontSize: 20,
  },
  text: {
    color: "#fafafa",
  },
  messageContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16, // ปรับ padding
  },
  inputContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20, // ปรับ padding ด้านล่างสำหรับ iOS
    paddingTop: 10,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    paddingLeft: 12,
    paddingVertical: 16, // ปรับขนาด input เล็กน้อย
    paddingRight: 96,
    color: "#333",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb", // สีฟ้าสดใส
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    position: "absolute",
    right: 8,
    top: 6,
    // Add shadow for better visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "flex-start", // ให้ข้อความจัดชิดด้านบน
    gap: 8,
    // เพิ่มความกว้างสูงสุดให้ข้อความ
    maxWidth: "90%",
  },
  message: {
    color: "#000",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: "85%",
    lineHeight: 20,
  },
  // ลบ styles สำหรับ techTitle และ techDescription ออกแล้ว
  loadingContainer: {
    color: "#475569",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 10,
    paddingTop: 10,
  },
  loadingText: {
    color: "#475569", // ⚪ สีเทาเข้ม
  },
});
