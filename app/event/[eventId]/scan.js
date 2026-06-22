import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../../components/RoutePlaceholder";

export default function ScanEventScreen() {
  const { eventId } = useLocalSearchParams();
  return <RoutePlaceholder title={`Scan ${eventId || ""}`} description="Event scan route placeholder." />;
}
