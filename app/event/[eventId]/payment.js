import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../../components/RoutePlaceholder";

export default function PaymentEventScreen() {
  const { eventId } = useLocalSearchParams();
  return <RoutePlaceholder title={`Payment ${eventId || ""}`} description="Standard payment route placeholder." />;
}
