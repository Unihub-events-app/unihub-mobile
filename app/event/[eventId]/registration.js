import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../../components/RoutePlaceholder";

export default function RegistrationEventScreen() {
  const { eventId } = useLocalSearchParams();
  return <RoutePlaceholder title={`Register ${eventId || ""}`} description="Event registration route placeholder." />;
}
