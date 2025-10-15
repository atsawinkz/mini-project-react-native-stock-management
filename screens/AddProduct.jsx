// src/screens/AddProduct.js
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AddProduct({ navigation }) {
  // We no longer need the 'id' state because Firestore will generate it.
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation now only checks for name and price.
  const nameOk = name.trim().length >= 2;
  const priceOk = parseFloat(price) > 0;
  const canSubmit = useMemo(() => nameOk && priceOk && !loading, [nameOk, priceOk, loading]);

  const handleAddFruit = async () => {
    try {
      setLoading(true);

      // We use 'addDoc' to let Firestore auto-generate a unique ID.
      // We pass the collection reference and the fruit data.
      await addDoc(collection(db, "fruits"), {
        name: name.trim(),
        price: parseFloat(price),
        createdAt: serverTimestamp(),
      });

      Alert.alert("สำเร็จ", `เพิ่มผลไม้ "${name.trim()}" เรียบร้อยแล้ว`);
      navigation.goBack(); // Navigate back to the previous screen
    } catch (err) {
      console.error(err);
      Alert.alert("เกิดข้อผิดพลาด", "เพิ่มผลไม้ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>เพิ่มผลไม้ใหม่</Text>

        <Text style={styles.label}>ชื่อผลไม้</Text>
        <TextInput style={styles.input} placeholder="กรอกชื่อผลไม้" value={name} onChangeText={setName} autoCapitalize="words" />

        <Text style={styles.label}>ราคา</Text>
        <TextInput style={styles.input} placeholder="กรอกราคา" keyboardType="numeric" value={price} onChangeText={setPrice} />

        <Pressable onPress={handleAddFruit} disabled={!canSubmit} style={({ pressed }) => [styles.button, { opacity: canSubmit ? (pressed ? 0.7 : 1) : 0.4 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>เพิ่มผลไม้</Text>}
        </Pressable>

        <View style={styles.hints}>
          {/* Removed the hint for ID */}
          <Text style={styles.hint}>{nameOk ? "✅" : "•"} ชื่อผลไม้ต้องมีอย่างน้อย 2 ตัวอักษร</Text>
          <Text style={styles.hint}>{priceOk ? "✅" : "•"} ราคาต้องมากกว่า 0</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 480, backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 10, elevation: 4 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  label: { fontSize: 13, color: "#334155" },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 16, backgroundColor: "#fff" },
  button: { height: 48, borderRadius: 12, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginTop: 6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hints: { marginTop: 8, gap: 4 },
  hint: { color: "#475569", fontSize: 13 },
});