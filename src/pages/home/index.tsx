import { Card } from "@blueprintjs/core";
import CurrentTimeDisplay from "../../features/common/components/CurrentTimeDisplay";
import { JobcanSection } from "../../features/jobcan/components/JobcanSection";
import { SlackWFSection } from "../../features/slackwf/components/SlackWFSection";

export const HomePage: React.FC = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <Card elevation={2} style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ marginBottom: "40px" }}>
          <CurrentTimeDisplay
            size="large"
            elevation={0}
            showIcon={true}
            showDate={true}
            showSeconds={true}
            transparent={true}
          />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <JobcanSection />
        </div>

        <SlackWFSection />
      </Card>
    </div>
  );
};
