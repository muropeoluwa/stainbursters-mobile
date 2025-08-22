import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

type ReceiptScreenProps = {
  route: {
    params: {
      orderDetails: {
        customerName: string;
        phone: string;
        items: { name: string; quantity: number; price: number }[];
        totalAmount: number;
        amountPaid: number;
        balanceDue: number;
        timestamp: string;
        traderName: string;
      };
    };
  };
};

const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ route }) => {
  const { orderDetails } = route.params;
  const {
    customerName,
    phone,
    items,
    totalAmount,
    amountPaid,
    balanceDue,
    timestamp,
    traderName,
  } = orderDetails;

  const generateHtml = () => {
    const itemRows = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 6px;">${item.name}</td>
          <td style="padding: 6px; text-align: center;">${item.quantity}</td>
          <td style="padding: 6px; text-align: right;">₦${(
            item.price * item.quantity
          ).toLocaleString()}</td>
        </tr>`
      )
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .card { border: 1px solid #ccc; padding: 20px; border-radius: 16px; background: #fff; }
            .header { text-align: center; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { font-size: 16px; color: #555; margin-bottom: 4px; }
            .section { margin-top: 20px; }
            .label { font-weight: bold; margin-bottom: 4px; display: block; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border-bottom: 1px solid #eee; padding: 8px; }
            th { text-align: left; background: #f2f2f2; }
            .total { font-weight: bold; color: #000; }
            .balance { color: crimson; font-weight: bold; }
            .footer { margin-top: 20px; text-align: center; font-style: italic; color: #777; }
            .logo { max-width: 100px; margin: 0 auto 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <img class="logo" src="https://stainbursters.name.ng/assets/logo.png" />
              <div class="title">🧺 StainBursters Receipt</div>
              <div class="subtitle">Walk-in Laundry Order</div>
              <div class="subtitle">📆 ${timestamp}</div>
            </div>

            <div class="section">
              <span class="label">Customer:</span>
              ${customerName} (${phone})
            </div>

            <div class="section">
              <span class="label">Items:</span>
              <table>
                <thead>
                  <tr><th>Item</th><th>Qty</th><th style="text-align:right;">Total</th></tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="total">Total: ₦${totalAmount.toLocaleString()}</div>
              <div>Paid: ₦${amountPaid.toLocaleString()}</div>
              <div class="balance">Balance Due: ₦${balanceDue.toLocaleString()}</div>
            </div>

            <div class="footer">
              🧾 Handled by: ${traderName}<br />
              Thank you for trusting us! Visit www.stainbursters.name.ng to read about us...
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const exportToPdf = async () => {
    try {
      const html = generateHtml();
      const { uri } = await Print.printToFileAsync({ html });

      // Use expo-sharing only if available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF Generated", `Saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to generate or share PDF");
      console.error(err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🧺 StainBursters Receipt</Text>
        <Text style={styles.subtitle}>Walk-in Laundry Order</Text>
        <Text style={styles.timestamp}>📆 {timestamp}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Customer:</Text>
          <Text>
            {customerName} ({phone})
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Items:</Text>
          {items.map((item, idx) => (
            <Text key={idx}>
              • {item.name} × {item.quantity} — ₦
              {(item.price * item.quantity).toLocaleString()}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total: ₦{totalAmount.toLocaleString()}</Text>
          <Text>Paid: ₦{amountPaid.toLocaleString()}</Text>
          <Text style={styles.balance}>
            Balance Due: ₦{balanceDue.toLocaleString()}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>🧾 Handled by: {traderName}</Text>
          <Text style={styles.thankyou}>Thank you for trusting us!</Text>
        </View>

        <Button title="📤 Export as PDF" onPress={exportToPdf} />
      </View>
    </ScrollView>
  );
};

export default ReceiptScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 10,
    color: "#555",
  },
  timestamp: {
    textAlign: "center",
    marginBottom: 20,
    color: "#888",
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  balance: {
    fontWeight: "bold",
    color: "crimson",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginTop: 20,
    paddingTop: 10,
    alignItems: "center",
  },
  thankyou: {
    marginTop: 6,
    fontStyle: "italic",
    color: "#777",
  },
});
