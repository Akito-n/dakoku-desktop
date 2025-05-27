import { Card, Icon } from "@blueprintjs/core";
import { useCurrentTime } from "../hooks/useCurrentTime";

interface CurrentTimeDisplayProps {
  showIcon?: boolean;
  showDate?: boolean;
  showSeconds?: boolean;
  size?: "small" | "medium" | "large";
  elevation?: 0 | 1 | 2 | 3 | 4;
  transparent?: boolean;
}

const CurrentTimeDisplay: React.FC<CurrentTimeDisplayProps> = ({
  showIcon = true,
  showDate = true,
  showSeconds = true,
  size = "medium",
  elevation = 1,
  transparent = false,
}) => {
  const { timeString, dateString } = useCurrentTime({
    updateInterval: showSeconds ? 1000 : 60000,
  });

  const displayTime = showSeconds ? timeString : timeString.substring(0, 5); // HH:MM のみ

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          padding: "10px 15px",
          fontSize: 14,
          iconSize: 14,
          dateSize: 12,
        };
      case "large":
        return {
          padding: "25px 30px",
          fontSize: 32,
          iconSize: 28,
          dateSize: 18,
        };
      // case "medium":
      default:
        return {
          padding: "15px 20px",
          fontSize: 20,
          iconSize: 18,
          dateSize: 14,
        };
    }
  };

  const styles = getSizeStyles();

  const backgroundStyle = transparent
    ? {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
      }
    : {
        backgroundColor: "#f8f9fa",
        border: "1px solid #e1e5e9",
      };

  return (
    <Card
      elevation={transparent ? 0 : elevation}
      style={{
        textAlign: "center",
        padding: styles.padding,
        ...backgroundStyle,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {showIcon && (
          <Icon
            icon="time"
            size={styles.iconSize}
            style={{ color: "#106ba3" }}
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {showDate && (
            <div
              style={{
                fontSize: `${styles.dateSize}px`,
                color: "#5c7080",
                marginBottom: "4px",
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {dateString}
            </div>
          )}
          <div
            style={{
              fontSize: `${styles.fontSize}px`,
              color: "#106ba3",
              fontWeight: 600,
              fontFamily: "monospace",
              lineHeight: 1,
            }}
          >
            {displayTime}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CurrentTimeDisplay;
