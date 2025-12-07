import { useEffect, useState } from "react";

export default function EventTable({ token }) {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!token) return;

        const fetchEvents = async () => {
            try {
                const res = await fetch(
                    "http://localhost:8091/api/v1/events?page=0&size=10",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error("Ошибка загрузки событий");
                }

                const data = await res.json();
                console.log("Ответ API:", data);
                setEvents(data.content ?? []);
            } catch (e) {
                console.error(e);
            }
        };

        fetchEvents();
    }, [token]);

    if (!events.length) return <div>Нет данных</div>;

    return (
        <table border="1" cellPadding="8">
            <thead>
            <tr>
                <th>UID</th>
                <th>Тип</th>
                <th>Описание</th>
                <th>Создано</th>
            </tr>
            </thead>
            <tbody>
            {events.map((event) => (
                <tr key={event.uid}>
                    <td>{event.uid}</td>
                    <td>{event.type}</td>
                    <td>{event.description}</td>
                    <td>{new Date(event.created_at).toLocaleString()}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
