import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/utils/auth/useAuth";
import useUser from "@/utils/auth/useUser";
import { Camera, ChefHat, Heart, LogOut } from "lucide-react-native";

export default function Index() {
  const insets = useSafeAreaInsets();
  const { signIn, signOut, isAuthenticated, isReady } = useAuth();
  const { data: user, loading: userLoading } = useUser();

  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recipe-generator");

  // Recipe Generator State
  const [ingredients, setIngredients] = useState("");
  const [preferences, setPreferences] = useState("");
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeSuggestions, setRecipeSuggestions] = useState("");

  // Image to Recipe State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/user-profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else if (isReady) {
      setProfileLoading(false);
    }
  }, [user, isReady]);

  // Handle recipe generation
  const handleGenerateRecipes = async () => {
    if (!ingredients.trim()) return;

    setRecipeLoading(true);
    try {
      const response = await fetch("/api/ai-recipe-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: ingredients.split(",").map((i) => i.trim()),
          preferences,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecipeSuggestions(data.suggestions);
      } else {
        setRecipeSuggestions(
          "Failed to generate recipe suggestions. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error generating recipes:", error);
      setRecipeSuggestions(
        "Failed to generate recipe suggestions. Please try again.",
      );
    } finally {
      setRecipeLoading(false);
    }
  };

  // Handle image upload and analysis
  const handleImageUpload = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      setImageLoading(true);

      try {
        // Convert to base64
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = async () => {
          const base64 = reader.result;

          // Analyze image
          const analysisResponse = await fetch("/api/image-to-recipe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageBase64: base64,
            }),
          });

          if (analysisResponse.ok) {
            const data = await analysisResponse.json();
            setImageAnalysis(data.analysis);
          } else {
            setImageAnalysis("Failed to analyze image. Please try again.");
          }
          setImageLoading(false);
        };

        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error analyzing image:", error);
        setImageAnalysis("Failed to analyze image. Please try again.");
        setImageLoading(false);
      }
    }
  }, []);

  if (!isReady || userLoading || profileLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0fdf4",
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🧠</Text>
        <Text style={{ fontSize: 18, color: "#6b7280" }}>
          Loading Smart Recipe AI...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0fdf4",
          paddingHorizontal: 20,
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          🧠 Smart Recipe & Health Assistant AI
        </Text>
        <Text
          style={{
            fontSize: 18,
            color: "#6b7280",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          Get personalized recipe recommendations based on your health and
          available ingredients
        </Text>
        <TouchableOpacity
          onPress={signIn}
          style={{
            backgroundColor: "#16a34a",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 16,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0fdf4",
          paddingHorizontal: 20,
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Welcome to Smart Recipe AI! 🧠
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#6b7280",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Complete your health profile to get personalized recommendations
        </Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Profile Setup",
              "Please complete your profile setup on the web version first.",
            )
          }
          style={{
            backgroundColor: "#16a34a",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
            Complete Profile Setup
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "white",
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>🧠</Text>
          <View>
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}
            >
              Smart Recipe AI
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280" }}>
              Welcome back, {userProfile.full_name || user.email}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={{ padding: 8 }}>
          <LogOut size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Health Profile Summary */}
        <View
          style={{
            backgroundColor: "white",
            margin: 16,
            padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Heart size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
              Your Health Profile
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            <View>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: "#374151" }}
              >
                Health Conditions:
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>
                {userProfile.health_conditions?.length > 0
                  ? userProfile.health_conditions.join(", ")
                  : "None specified"}
              </Text>
            </View>
            <View>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: "#374151" }}
              >
                Food Preferences:
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>
                {userProfile.food_preferences || "Not specified"}
              </Text>
            </View>
            <View>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: "#374151" }}
              >
                Allergies:
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>
                {userProfile.allergies?.length > 0
                  ? userProfile.allergies.join(", ")
                  : "None specified"}
              </Text>
            </View>
          </View>
        </View>

        {/* Feature Tabs */}
        <View
          style={{
            backgroundColor: "white",
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
            overflow: "hidden",
          }}
        >
          {/* Tab Navigation */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("recipe-generator")}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 12,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeTab === "recipe-generator" ? "#16a34a" : "transparent",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ChefHat
                  size={16}
                  color={
                    activeTab === "recipe-generator" ? "#16a34a" : "#6b7280"
                  }
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: "500",
                    color:
                      activeTab === "recipe-generator" ? "#16a34a" : "#6b7280",
                  }}
                >
                  Recipe Generator
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("image-to-recipe")}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 12,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeTab === "image-to-recipe" ? "#16a34a" : "transparent",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Camera
                  size={16}
                  color={
                    activeTab === "image-to-recipe" ? "#16a34a" : "#6b7280"
                  }
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: "500",
                    color:
                      activeTab === "image-to-recipe" ? "#16a34a" : "#6b7280",
                  }}
                >
                  Image to Recipe
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={{ padding: 16 }}>
            {activeTab === "recipe-generator" && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1f2937",
                      marginBottom: 8,
                    }}
                  >
                    Smart Recipe Generator
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}
                  >
                    Enter your available ingredients and get personalized recipe
                    suggestions.
                  </Text>
                </View>

                <View style={{ gap: 12 }}>
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: 8,
                      }}
                    >
                      Available Ingredients (comma-separated)
                    </Text>
                    <TextInput
                      value={ingredients}
                      onChangeText={setIngredients}
                      style={{
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        fontSize: 16,
                        backgroundColor: "white",
                      }}
                      placeholder="e.g., chicken, spinach, rice, tomatoes"
                      multiline
                    />
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: 8,
                      }}
                    >
                      Additional Preferences (optional)
                    </Text>
                    <TextInput
                      value={preferences}
                      onChangeText={setPreferences}
                      style={{
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        fontSize: 16,
                        backgroundColor: "white",
                      }}
                      placeholder="e.g., quick meals, low sodium, spicy"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleGenerateRecipes}
                    disabled={recipeLoading || !ingredients.trim()}
                    style={{
                      backgroundColor:
                        recipeLoading || !ingredients.trim()
                          ? "#9ca3af"
                          : "#16a34a",
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    {recipeLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Generate Smart Recipes
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {recipeSuggestions && (
                  <View
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: 8,
                      }}
                    >
                      AI Recipe Suggestions:
                    </Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#374151",
                          lineHeight: 20,
                        }}
                      >
                        {recipeSuggestions}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {activeTab === "image-to-recipe" && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1f2937",
                      marginBottom: 8,
                    }}
                  >
                    Image to Recipe
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}
                  >
                    Upload a photo of your ingredients and get AI-powered recipe
                    suggestions.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleImageUpload}
                  style={{
                    borderWidth: 2,
                    borderColor: "#16a34a",
                    borderStyle: "dashed",
                    borderRadius: 8,
                    paddingVertical: 24,
                    alignItems: "center",
                    backgroundColor: "#f0fdf4",
                  }}
                >
                  <Camera size={32} color="#16a34a" />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#16a34a",
                      fontWeight: "600",
                      marginTop: 8,
                    }}
                  >
                    Upload Ingredient Photo
                  </Text>
                </TouchableOpacity>

                {selectedImage && (
                  <View style={{ alignItems: "center" }}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={{ width: "100%", height: 200, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {imageLoading && (
                  <View style={{ alignItems: "center", paddingVertical: 16 }}>
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text
                      style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}
                    >
                      Analyzing image...
                    </Text>
                  </View>
                )}

                {imageAnalysis && (
                  <View
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: 8,
                      }}
                    >
                      AI Analysis & Recipe Suggestions:
                    </Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#374151",
                          lineHeight: 20,
                        }}
                      >
                        {imageAnalysis}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
