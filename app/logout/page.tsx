"use client";

import {  signOut } from "next-auth/react";

export default function Logout() {

  
  return (
    <div style={{ padding: "2rem" }}>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })} // redirect after logout
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#4F46E5",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}