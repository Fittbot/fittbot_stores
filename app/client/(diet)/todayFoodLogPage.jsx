import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import EmptyStateCard from "../../../components/ui/Workout/EmptyDataComponent";
import { Ionicons } from "@expo/vector-icons";
// import TopPageBar from './TopPageBar';
import { FlatList } from "react-native-gesture-handler";
import FoodCard from "../../../components/ui/Diet/FoodCard";
import GradientButton from "../../../components/ui/GradientButton";
const { width, height } = Dimensions.get("window");
import TopPageBar from "../../../components/ui/TopPageBar";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

const RenderFoodCards = ({ mockData, showTopBar = true }) => {
  const router = useRouter();

  return (
    <>
      <View style={styles.sectionContainer}>
        {/* <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => {
            router.push('/client/diet');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Today Food Log</Text>
        </TouchableOpacity> */}
        <HardwareBackHandler routePath="/client/diet" enabled={true} />

        {showTopBar && (
          <TopPageBar
            title="Today’s Food Log"
            navigateTo="/client/addFoodListPage"
            //   containerStyle={{ marginBottom: 10 }}
            textStyle={{ fontSize: 12 }}
          />
        )}

        <FlatList
          data={mockData.reverse()}
          keyExtractor={(item, index) => item.id}
          renderItem={({ item }) => {
            return (
              <FoodCard
                id={item.id}
                image={item.image}
                title={item.name}
                calories={item.calories}
                carbs={item.carbs}
                fat={item.fat}
                protein={item.protein}
                quantity={item.quantity}
                onAdd={() => {}}
                time={item.timeAdded}
              />
            );
            // <View style={{ marginBottom: 16 }}>
            //   <SkeletonPlaceholder borderRadius={4}>
            //     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            //       <View style={{ width: 60, height: 60, borderRadius: 50 }} />
            //       <View style={{ marginLeft: 20 }}>
            //         <View style={{ width: 120, height: 20, marginBottom: 6 }} />
            //         <View style={{ width: 80, height: 20 }} />
            //       </View>
            //     </View>
            //   </SkeletonPlaceholder>
            // </View>
          }}
          contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }}
        />

        <View style={{ marginBottom: 20 }}>
          <GradientButton
            title="View Full Report"
            fromColor="#28A745"
            toColor="#007BFF"
            onPress={() => {}}
            navigateTo="/client/diet"
            params={{ selectedTab: "Reports" }}
            containerStyle={{ marginTop: 0 }}
            textStyle={{ fontSize: 12 }}
            belowButtonText={"Forgot to Log? Tap Here "}
            onButtonPress2={() =>
              router.push({
                pathname: "/client/addFoodListPage",
                params: { date: new Date() },
              })
            }
          />
        </View>
      </View>
    </>
  );
};

export default RenderFoodCards;

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: height * 0.02,
    marginTop: height * 0.04,
    padding: width * 0.04,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
});
