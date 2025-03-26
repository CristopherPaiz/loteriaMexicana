import PropTypes from "prop-types";
import { useEffect, useState } from "react";

const CountdownTimer = ({ countdown, totalTime }) => {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    setProgress((countdown / totalTime) * 100);
  }, [countdown, totalTime]);
  
  const circumference = 2 * Math.PI * 32;
  const strokeDashoffset = circumference * (1 - progress / 100);
  
  // Calcular color basado en el tiempo restante
  const getColor = () => {
    if (progress > 60) return "#4CAF50"; // Verde
    if (progress > 30) return "#FFC107"; // Amarillo
    return "#FF5252"; // Rojo
  };
  
  return (
    <div className="loteria-countdown">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Círculo base (oscuro) */}
        <circle cx="40" cy="40" r="32" fill="rgba(0, 0, 0, 0.5)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
        
        {/* Círculo de progreso */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="transparent"
          stroke={getColor()}
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            transformOrigin: "center",
            transform: "rotate(-90deg)",
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease",
            filter: "drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))"
          }}
        />
        
        {/* Texto central */}
        <text
          x="40"
          y="40"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="26"
          fontWeight="bold"
          style={{
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.7)",
          }}
        >
          {countdown}
        </text>
        
        {/* Pequeño círculo decorativo */}
        <circle
          cx="40"
          cy="8"
          r="3"
          fill={getColor()}
          style={{
            filter: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))"
          }}
        />
      </svg>
      
      {/* Efecto de luz ambiental */}
      <div
        className="glow-effect"
        style={{
          backgroundColor: getColor(),
          opacity: progress / 300 + 0.1 // Sutilmente más brillante cuando queda más tiempo
        }}
      />
    </div>
  );
};

CountdownTimer.propTypes = {
  countdown: PropTypes.number.isRequired,
  totalTime: PropTypes.number.isRequired
};

export default CountdownTimer;