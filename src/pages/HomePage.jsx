import { useEffect, useState } from "react";
import axios from "axios";

export default function HomePage() {
  const [pins, setPins] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/pins`)

      .then(res => setPins(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📌 Pinterest-Style Feed</h1>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        {pins.map(pin => (
          <div key={pin.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "10px",
              width: "200px",
              textAlign: "center"
            }}>
            <img src={pin.image} alt={pin.title}
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "10px"
              }} />
            <p>{pin.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
