// screens/rider/PendingOrdersScreen.js
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../../context/AuthContext";
import CustomModal from "../../components/CustomModal";

const PendingOrdersScreen = () => {
  const { token } = useContext(AuthContext);
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const showModal = (message) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const fetchPendingOrders = async () => {
    try {
      if (!refreshing) setLoading(true);

      const response = await fetch(
        "https://stainbursters.name.ng/api/get_rider_orders.php",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();
      console.log("📦 Raw pending orders response:", text);

      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        showModal("❌ Invalid server response.");
        return;
      }

      if (json.success) {
        // Group orders by trader_id
        const grouped = json.orders.reduce((acc, order) => {
          const key = order.trader_id;
          if (!acc[key]) {
            acc[key] = {
              traderName: order.trader_name || `Trader #${order.trader_id}`,
              orders: [],
            };
          }
          acc[key].orders.push(order);
          return acc;
        }, {});
        setGroupedOrders(grouped);
      } else {
        showModal(json.message || "Failed to fetch orders.");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      showModal("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const confirmPickup = async (orderId) => {
    try {
      const response = await fetch(
        "https://stainbursters.name.ng/api/confirm_rider_pickup.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_id: orderId }),
        }
      );

      const text = await response.text();
      console.log("🚚 Confirm pickup response:", text);

      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        showModal("❌ Invalid server response.");
        return;
      }

      if (json.success) {
        showModal("✅ Pickup confirmed successfully!");
        fetchPendingOrders();
      } else {
        showModal(json.message || "Failed to confirm pickup.");
      }
    } catch (error) {
      console.error("❌ Pickup error:", error);
      showModal("Network error while confirming pickup.");
    }
  };

  const renderOrder = (item) => {
    let itemsList = [];
    try {
      itemsList = JSON.parse(item.items);
    } catch {
      itemsList = [];
    }

    return (
      <View style={styles.card} key={item.id}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.orderDate}>{item.created_at}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>👤 {item.customer_name || "Walk-in"}</Text>
          <Text style={styles.text}>📞 {item.customer_phone || "N/A"}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.text}>💰 Total: ₦{item.total_amount}</Text>
          <Text style={styles.text}>📍 Status: {item.status}</Text>
        </View>

        {itemsList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {itemsList.map((i, idx) => (
              <View key={`${item.id}-${idx}`} style={styles.itemPill}>
                <Text style={styles.itemText}>
                  {i.name} - ₦{i.price}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          onPress={() => confirmPickup(item.id)}
          style={styles.pickupBtn}
        >
          <Text style={styles.pickupBtnText}>✅ Confirm Pickup</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading pending orders...</Text>
      </SafeAreaView>
    );
  }

  const traderIds = Object.keys(groupedOrders);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>🚚 Pending Orders</Text>

      {traderIds.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No pending orders found.</Text>
        </View>
      ) : (
        <FlatList
          data={traderIds}
          keyExtractor={(id) => id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPendingOrders();
              }}
              colors={["#16a34a"]}
            />
          }
          renderItem={({ item: traderId }) => {
            const group = groupedOrders[traderId];
            return (
              <View style={{ marginBottom: 24 }} key={traderId}>
                <Text style={styles.traderHeader}>
                  🏪 {group.traderName}
                </Text>
                {group.orders.map((order) => (
                  <View key={order.id}>{renderOrder(order)}</View>
                ))}
              </View>
            );
          }}
        />
      )}

      <CustomModal
        visible={modalVisible}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default PendingOrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  heading: { fontSize: 22, fontWeight: "bold", color: "#111827", marginBottom: 16 },
  traderHeader: { fontSize: 18, fontWeight: "600", color: "#065f46", marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  orderDate: { fontSize: 12, color: "#6b7280" },
  section: { marginBottom: 8 },
  text: { fontSize: 14, color: "#374151" },
  summaryBox: { backgroundColor: "#f3f4f6", borderRadius: 12, padding: 10, marginBottom: 10 },
  itemPill: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  itemText: { fontSize: 13, fontWeight: "500", color: "#065f46" },
  pickupBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 12, marginTop: 6 },
  pickupBtnText: { textAlign: "center", color: "#fff", fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#6b7280" },
  emptyText: { fontSize: 15, color: "#6b7280" },
});
