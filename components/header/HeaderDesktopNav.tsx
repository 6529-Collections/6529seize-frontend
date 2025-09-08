"use client";

import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavDropdown } from "react-bootstrap";
import styles from "./Header.module.scss";
import HeaderDesktopLink from "./HeaderDesktopLink";
import { getDesktopNavigation, toolsBottomItems, type NavContext } from "./HeaderNavConfig";

interface HeaderDesktopNavProps {
  showWaves: boolean;
  appWalletsSupported: boolean;
  capacitorIsIos: boolean;
  country: string;
  pathname?: string;
}

export default function HeaderDesktopNav({
  showWaves,
  appWalletsSupported,
  capacitorIsIos,
  country,
  pathname,
}: HeaderDesktopNavProps) {
  const context: NavContext = {
    showWaves,
    appWalletsSupported,
    capacitorIsIos,
    country,
    pathname,
  };

  const navigation = getDesktopNavigation(context);

  const renderNavLink = (link: any) => {
    if (link.condition && !link.condition(context)) {
      return null;
    }
    return (
      <HeaderDesktopLink
        key={link.name}
        link={{
          name: link.name,
          path: link.path,
        }}
      />
    );
  };

  const renderSection = (section: any) => (
    <div key={section.name} className={styles.submenuContainer}>
      {section.hasDivider && <NavDropdown.Divider />}
      <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
        {section.name}
        <FontAwesomeIcon
          icon={faChevronRight}
          height={16}
          width={16}
        />
      </div>
      <div className={styles.nestedMenu}>
        {section.items.map(renderNavLink)}
        {section.hasDivider && <NavDropdown.Divider />}
      </div>
    </div>
  );

  const renderDropdown = (dropdown: any) => {
    if (dropdown.condition && !dropdown.condition(context)) {
      return null;
    }

    let className = `${styles.mainNavLink} ${styles.mainNavLinkPadding}`;
    if (dropdown.className) {
      const dynamicClassName = typeof dropdown.className === 'function' 
        ? dropdown.className(context) 
        : dropdown.className;
      if (dynamicClassName) {
        className += ` ${dynamicClassName}`;
      }
    }

    return (
      <NavDropdown
        key={dropdown.title}
        title={dropdown.title}
        align="start"
        className={className}
      >
        {dropdown.items?.map(renderNavLink)}
        
        {dropdown.sections?.map(renderSection)}
        
        {dropdown.title === "Tools" && (
          <>
            {dropdown.hasDividerAfter && <NavDropdown.Divider />}
            {toolsBottomItems.map(renderNavLink)}
          </>
        )}
      </NavDropdown>
    );
  };

  return (
    <>
      {navigation.map(renderDropdown)}
    </>
  );
}