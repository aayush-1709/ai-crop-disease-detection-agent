import React, { useState, useEffect } from "react";

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: "fixed",   // stays fixed on screen
        bottom: "20px",
        right: "20px",
        padding: "10px 15px",
        fontSize: "16px",
        borderRadius: "5px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        opacity: visible ? 1 : 0,   // fade in/out
        transition: "opacity 0.3s ease-in-out",
      }}
    >
      ↑ Top
    </button>
  );
}

export default ScrollToTopButton;