import { Button, Intent, type IconName } from "@blueprintjs/core";

export interface ActionButtonProps {
  label: string;
  icon: IconName;
  intent?: Intent;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: "small" | "medium" | "large";
  style?: React.CSSProperties;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  intent = Intent.NONE,
  loading = false,
  disabled = false,
  onClick,
  size = "medium",
  style,
  className,
}) => {
  const getSizeConfig = () => {
    switch (size) {
      case "small":
        return {
          large: false,
          height: "32px",
          fontSize: "12px",
        };
      case "large":
        return {
          large: true,
          height: "48px",
          fontSize: "16px",
        };
      default: // medium
        return {
          large: false,
          height: "40px",
          fontSize: "14px",
        };
    }
  };

  const sizeConfig = getSizeConfig();

  return (
    <Button
      intent={intent}
      icon={icon}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      large={sizeConfig.large}
      className={className}
      style={{
        height: sizeConfig.height,
        fontSize: sizeConfig.fontSize,
        fontWeight: size === "large" ? "600" : "normal",
        ...style,
      }}
    >
      {loading ? "実行中..." : label}
    </Button>
  );
};

export default ActionButton;
