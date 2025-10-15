import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ActivityIndicator, StyleSheet, Pressable, Alert } from "react-native";
import { subscribeFruit, updateFruit, deleteFruit } from "../data/fruitsApi";
import { auth } from "../firebase";

export default function UpdateProduct({ route, navigation }) {
  const { id } = route?.params || {};
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const unsub = subscribeFruit(
      id,
      (data) => {
        setProduct(data);
        setName(data?.name || "");
        setPrice(data?.price?.toString() || "");
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [id]);

  const nameOk = name.trim().length >= 2;
  const priceOk = parseFloat(price) > 0;
  const dirty = useMemo(() => (
    product && (name !== (product.name || "") || parseFloat(price) !== (product.price || 0))
  ), [name, price, product]);
  const canSave = useMemo(() => dirty && nameOk && priceOk && !saving, [dirty, nameOk, priceOk, saving]);

  const onSave = async () => {
    try {
      setSaving(true);
      await updateFruit(id, { name: name.trim(), price: parseFloat(price) });
      Alert.alert('สำเร็จ', 'บันทึกข้อมูลผลไม้เรียบร้อย');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      'ลบผลไม้',
      'คุณต้องการลบผลไม้นี้หรือไม่? ข้อมูลจะหายถาวร',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ', style: 'destructive', onPress: async () => {
            try {
              await deleteFruit(id);
              Alert.alert('ลบแล้ว', 'ผลไม้ถูกลบเรียบร้อย');
              navigation.goBack();
            } catch (e) {
              console.error(e);
              Alert.alert('ผิดพลาด', 'ไม่สามารถลบผลไม้ได้');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#475569" }}>กำลังโหลดข้อมูลผลไม้…</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>ไม่พบข้อมูลผลไม้</Text>
        <Text style={styles.text}>โปรดลองใหม่อีกครั้ง</Text>
        <Pressable style={[styles.button, { marginTop: 12 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>กลับ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.title}>ข้อมูลผลไม้ (CRUD)</Text>
        <Item label="ID" value={product.id} />

        <Text style={styles.label}>ชื่อผลไม้</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>ราคา</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Pressable onPress={onSave} disabled={!canSave} style={({ pressed }) => [styles.button, { flex: 1, opacity: canSave ? (pressed ? 0.7 : 1) : 0.4 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>บันทึก</Text>}
          </Pressable>
          <Pressable onPress={onDelete} style={({ pressed }) => [styles.buttonDanger, { flex: 1, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.buttonText}>ลบผลไม้</Text>
          </Pressable>  
        </View>
      </View>
    </View>
  );
}

function Item({ label, value }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: "#334155", fontSize: 12 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: "600" }}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f1f5f9", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 6, elevation: 2 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  text: { color: "#475569" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" },
  label: { fontSize: 13, color: "#334155", marginTop: 6 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 16, backgroundColor: "#fff" },
  button: { height: 48, borderRadius: 12, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  buttonDanger: { height: 48, borderRadius: 12, backgroundColor: "#dc2626", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});