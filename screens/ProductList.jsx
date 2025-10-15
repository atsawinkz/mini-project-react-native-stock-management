import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { subscribeFruits } from '../data/fruitsApi';


export default function ProductList({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState('');

    useEffect(() => {
        const unsub = subscribeFruits(
            (list) => { setRows(list); setLoading(false); },
            () => setLoading(false)
        );
        return () => unsub();
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter(r =>
            (r.name || '').toLowerCase().includes(s) ||
            (r.id || '').toLowerCase().includes(s)
        );
    }, [rows, q]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={{ marginTop: 8, color: '#475569' }}>กำลังโหลดรายชื่อผลไม้…</Text>
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.input}
                    placeholder="ค้นหา ชื่อ/ID"
                    value={q}
                    onChangeText={setQ}
                />
                <Pressable 
                    style={[styles.button, styles.chatButton]}
                    onPress={() => navigation.navigate('ChatScreen')}>
                    <Text style={styles.buttonText}>ถาม AI</Text>
                </Pressable>

                <Pressable style={styles.button} onPress={() => navigation.navigate('AddFruit')}>
                    <Text style={styles.buttonText}>เพิ่ม</Text>
                </Pressable>
            </View>


            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => (
                    <Pressable
                        // Navigate to a new screen, maybe 'UpdateFruit' with the fruit's ID
                        onPress={() => navigation.navigate('UpdateFruit', { id: item.id })}
                        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
                    >
                        <Text style={styles.name}>{item.name || '(ไม่มีชื่อ)'}</Text>
                        <Text style={styles.meta}>ราคา: {item.price ? `${item.price.toFixed(2)} บาท` : '-'}</Text>
                        <Text style={styles.uid}>ID: {item.id}</Text>
                    </Pressable>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748b', marginTop: 24 }}>ยังไม่มีผลไม้</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#f1f5f9', padding: 12 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    input: { flex: 1, height: 44, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12 },
    button: { height: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontWeight: '700' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    meta: { color: '#475569' },
    uid: { color: '#94a3b8', marginTop: 4, fontSize: 12 },
});