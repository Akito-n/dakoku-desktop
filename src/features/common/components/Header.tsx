import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Button,
  Alignment,
  Icon,
} from "@blueprintjs/core";

export type PageName = "home" | "settings";

interface HeaderProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  return (
    <Navbar
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #d3d8de",
        padding: "0 20px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <NavbarGroup align={Alignment.LEFT}>
        <NavbarHeading
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon icon="time" size={18} />
          Dakoku Desktop
        </NavbarHeading>
      </NavbarGroup>
      <NavbarGroup align={Alignment.RIGHT}>
        <Button
          minimal
          icon="home"
          text="ホーム"
          active={currentPage === "home"}
          onClick={() => onNavigate("home")}
        />
        <Button
          minimal
          icon="cog"
          text="設定"
          active={currentPage === "settings"}
          onClick={() => onNavigate("settings")}
        />
      </NavbarGroup>
    </Navbar>
  );
};
