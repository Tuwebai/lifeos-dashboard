export const WEATHER_API_KEY = '89b6227dbf6b443d9a0210851252612';

export const fetchWeather = async (location: string) => {
    try {
        const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${location}&lang=es`);
        const data = await res.json();
        if (data.error) return null;

        const code = data.current.condition.code;
        let type = 'clear';
        if ([1003, 1006, 1009].includes(code)) type = 'cloudy';
        if ([1030, 1063, 1150, 1153, 1180, 1183].includes(code)) type = 'drizzle';
        if ([1186, 1189, 1192, 1195, 1201, 1240, 1243, 1246].includes(code)) type = 'rain';
        if ([1087, 1273, 1276, 1279, 1282].includes(code)) type = 'storm';

        return {
            temp: Math.round(data.current.temp_c),
            text: data.current.condition.text,
            isNight: data.current.is_day === 0,
            humidity: data.current.humidity,
            wind: Math.round(data.current.wind_kph),
            type
        };
    } catch (e) {
        console.error('Weather Fetch Error:', e);
        return null;
    }
};
