import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import colors from "../constants/color";
import { useAuth } from "../custom-hooks/useAuth";

const Register = () => {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsLoading(true);
    await register(name, email, password, phone);
    router.push("/auth/login");
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginTitle}>Register</Text>

      {/* Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <AntDesign
            name={showPassword ? "eye" : "eye-invisible"}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Phone */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Phone"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, isLoading && { opacity: 0.7 }]}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/login")}>
        <Text style={styles.registerText}>
          Already have an account?{" "}
          <Text style={styles.registerLink}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Register;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#000", // Stayed with your dark theme
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 40,
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 20,
    position: "relative",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF", // Changed to white so it's visible on black
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#1A1A1A", // Darker input to match theme
    color: "#FFF",
  },
  registerText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.primary,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  eyeIcon: {
    position: "absolute",
    right: 15, // Space from the right edge
    height: "100%",
    top: 15,
    justifyContent: "center", // This handles the vertical centering
    alignItems: "center",
  },
});