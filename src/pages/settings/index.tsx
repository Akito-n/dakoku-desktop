import { H1, Icon } from "@blueprintjs/core";
import { AttendanceSettings } from "../../features/attendance/components/AttendanceSettings";
import { JobcanSettings } from "../../features/jobcan/components/JobcanSettings";
import { SlackWFSettings } from "../../features/slackwf/components/SlackWFSettings";

const SettingsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      {/* ページヘッダー */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <H1
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            margin: 0,
          }}
        >
          <Icon icon="cog" size={24} />
          設定管理
        </H1>
      </div>

      {/* 勤務時間設定 */}
      <AttendanceSettings />

      {/* Jobcan設定 */}
      <JobcanSettings />

      {/* SlackWF設定 */}
      <SlackWFSettings />
    </div>
  );
};

export default SettingsPage;
