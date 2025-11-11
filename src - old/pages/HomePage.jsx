import "./HomePage.css";
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
  <div>
    <h1 style={{ textAlign: "center", padding: "10px" }}>📌 Pinterest-Style Feed</h1>
    <div className="feed">
      {pins.map((pin) => (
        <div className="card" key={pin._id}>
          <img
            src={pin.mediaUrl || pin.image}
            alt={pin.title}
          />
          <h3>{pin.title}</h3>
          <p>{pin.description}</p>
        </div>
      ))}
    </div>
  </div>
);
}
