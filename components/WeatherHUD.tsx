import React from 'react';
import { 
  WeatherCondition, 
  getWeatherEffects,
  WEATHER_DATA,
  getTimeOfDay,
  getTimeLightLevel,
  TimeOfDay,
} from '../services/weatherService';

interface WeatherHUDProps {
  weather: WeatherCondition | null;
  currentHour: number;
  showDetails?: boolean;
}

const WeatherHUD: React.FC<WeatherHUDProps> = ({ 
  weather, 
  currentHour,
  showDetails = false,
}) => {
  if (!weather) return null;

  const weatherData = WEATHER_DATA[weather.type];
  const effects = getWeatherEffects(weather);
  const timeOfDay = getTimeOfDay(currentHour);
  const lightLevel = getTimeLightLevel(currentHour);

  const getWeatherIcon = (type: string): string => {
    const icons: Record<string, string> = {
      clear: '☀️',
      cloudy: '⛅',
      overcast: '☁️',
      foggy: '🌫️',
      misty: '🌁',
      light_rain: '🌦️',
      rain: '🌧️',
      heavy_rain: '⛈️',
      thunderstorm: '🌩️',
      light_snow: '🌨️',
      snow: '❄️',
      heavy_snow: '🌨️',
      blizzard: '🌬️',
      ash_storm: '🌋',
      volcanic: '🔥',
    };
    return icons[type] || '🌤️';
  };

  const getTimeIcon = (time: TimeOfDay): string => {
    const icons: Record<TimeOfDay, string> = {
      dawn: '🌅',
      morning: '🌄',
      midday: '☀️',
      afternoon: '🌤️',
      dusk: '🌆',
      evening: '🌇',
      night: '🌙',
      midnight: '🌑',
    };
    return icons[time];
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp <= -10) return '#00BFFF';
    if (temp <= 0) return '#87CEEB';
    if (temp <= 10) return '#B0E0E6';
    if (temp <= 20) return '#98FB98';
    if (temp <= 30) return '#FFD700';
    return '#FF6347';
  };

  const formatTemperature = (temp: number): string => {
    return `${temp > 0 ? '+' : ''}${temp}°C`;
  };

  // Compact view for HUD
  if (!showDetails) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '20px',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>{getTimeIcon(timeOfDay)}</span>
        <span style={{ fontSize: '1.2rem' }}>{getWeatherIcon(weather.type)}</span>
        <span style={{ 
          color: getTemperatureColor(weather.temperature),
          fontWeight: 'bold',
          fontSize: '0.9rem',
        }}>
          {formatTemperature(weather.temperature)}
        </span>
        {weather.windSpeed > 40 && (
          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
            💨 {weather.windSpeed}km/h
          </span>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <div
      style={{
        padding: '15px',
        background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: '280px',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <span style={{ fontSize: '2rem' }}>{getWeatherIcon(weather.type)}</span>
        <div>
          <div style={{ 
            fontWeight: 'bold', 
            color: '#fff',
            fontSize: '1.1rem',
          }}>
            {weatherData.name}
          </div>
          <div style={{ 
            color: '#9CA3AF', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            {getTimeIcon(timeOfDay)} {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
          </div>
        </div>
        <div style={{ 
          marginLeft: 'auto',
          textAlign: 'right',
        }}>
          <div style={{ 
            color: getTemperatureColor(weather.temperature),
            fontWeight: 'bold',
            fontSize: '1.3rem',
          }}>
            {formatTemperature(weather.temperature)}
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <div style={{
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
        }}>
          <div style={{ color: '#6B7280', fontSize: '0.7rem', marginBottom: '2px' }}>
            Visibility
          </div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {weather.visibility}%
          </div>
        </div>
        <div style={{
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
        }}>
          <div style={{ color: '#6B7280', fontSize: '0.7rem', marginBottom: '2px' }}>
            Wind
          </div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {weather.windSpeed} km/h
          </div>
        </div>
        <div style={{
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
        }}>
          <div style={{ color: '#6B7280', fontSize: '0.7rem', marginBottom: '2px' }}>
            Light Level
          </div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {lightLevel}%
          </div>
        </div>
        <div style={{
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
        }}>
          <div style={{ color: '#6B7280', fontSize: '0.7rem', marginBottom: '2px' }}>
            Precipitation
          </div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {weather.precipitation}%
          </div>
        </div>
      </div>

      {/* Effects */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
        <div style={{ 
          color: '#9CA3AF', 
          fontSize: '0.75rem', 
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Combat Effects
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {effects.rangedAccuracyMod !== 0 && (
            <span style={{
              padding: '3px 8px',
              background: effects.rangedAccuracyMod < 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: effects.rangedAccuracyMod < 0 ? '#FCA5A5' : '#86EFAC',
            }}>
              🏹 {effects.rangedAccuracyMod > 0 ? '+' : ''}{effects.rangedAccuracyMod}% Ranged
            </span>
          )}
          {effects.stealthMod !== 0 && (
            <span style={{
              padding: '3px 8px',
              background: effects.stealthMod > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: effects.stealthMod > 0 ? '#86EFAC' : '#FCA5A5',
            }}>
              👁️ {effects.stealthMod > 0 ? '+' : ''}{effects.stealthMod}% Stealth
            </span>
          )}
          {effects.magicCostMod !== 0 && (
            <span style={{
              padding: '3px 8px',
              background: effects.magicCostMod < 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: effects.magicCostMod < 0 ? '#86EFAC' : '#FCA5A5',
            }}>
              🔮 {effects.magicCostMod > 0 ? '+' : ''}{effects.magicCostMod}% Spell Cost
            </span>
          )}
          {effects.movementSpeedMod !== 0 && (
            <span style={{
              padding: '3px 8px',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#FCA5A5',
            }}>
              🏃 {effects.movementSpeedMod}% Speed
            </span>
          )}
        </div>
        
        {/* Survival effects */}
        {(effects.warmthDrain > 0 || effects.staminaDrain > 0) && (
          <>
            <div style={{ 
              color: '#9CA3AF', 
              fontSize: '0.75rem', 
              marginTop: '8px',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Survival Effects
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {effects.warmthDrain > 0 && (
                <span style={{
                  padding: '3px 8px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#93C5FD',
                }}>
                  🥶 -{effects.warmthDrain}/hr Warmth
                </span>
              )}
              {effects.staminaDrain > 0 && (
                <span style={{
                  padding: '3px 8px',
                  background: 'rgba(251, 191, 36, 0.2)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#FCD34D',
                }}>
                  😓 -{effects.staminaDrain}/hr Stamina
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeatherHUD;
