// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddProduct from "./screens/AddProduct";
import UpdateProduct from "./screens/UpdateProduct";
import ProductList from "./screens/ProductList";
import ChatScreen from "./screens/ChatScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="FruitList" component={ProductList} options={{ title: "รายการสินค้า" }} />
        <Stack.Screen name="AddFruit" component={AddProduct} options={{ title: "เพิ่มสินค้า" }} />
        <Stack.Screen name="UpdateFruit" component={UpdateProduct} options={{ title: "แก้ไข้ข้อมูลสินค้า" }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: "FruitGuruAI Assistant" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}