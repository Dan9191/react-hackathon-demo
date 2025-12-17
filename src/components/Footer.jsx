import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{
            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
            color: 'white',
            padding: '3rem 2rem 2rem',
            marginTop: 'auto', // Это важно для прижатия к низу
            width: '100%'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem'
            }}>
                {/* Лого и описание */}
                <div>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #64b5f6, #2196f3)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '1rem'
                    }}>
                        Мосстройинформ
                    </div>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        lineHeight: 1.5,
                        fontSize: '0.9rem'
                    }}>
                        Официальная платформа для подбора и проектирования домов. 
                        Более 100 готовых проектов от ведущих архитекторов.
                    </p>
                </div>

                {/* Навигация */}
                <div>
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        marginBottom: '1rem',
                        color: 'white'
                    }}>
                        Навигация
                    </h3>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <Link to="/" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}>
                                Главная
                            </Link>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <a href="#catalog" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}>
                                Каталог проектов
                            </a>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <a href="#about" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}>
                                О компании
                            </a>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <a href="#contacts" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}>
                                Контакты
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Контакты */}
                <div>
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        marginBottom: '1rem',
                        color: 'white'
                    }}>
                        Контакты
                    </h3>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Адрес:</strong><br />
                            г. Москва, ул. Строителей, д. 15
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Телефон:</strong><br />
                            <a href="tel:+74951234567" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none'
                            }}>
                                +7 (495) 123-45-67
                            </a>
                        </div>
                        <div>
                            <strong>Email:</strong><br />
                            <a href="mailto:info@mosstroyinform.ru" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none'
                            }}>
                                info@mosstroyinform.ru
                            </a>
                        </div>
                    </div>
                </div>

                {/* Документы */}
                <div>
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        marginBottom: '1rem',
                        color: 'white'
                    }}>
                        Документы
                    </h3>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <a href="#privacy" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}>
                                Политика конфиденциальности
                            </a>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <a href="#terms" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}>
                                Пользовательское соглашение
                            </a>
                        </li>
                        <li>
                            <a href="#offer" style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}>
                                Публичная оферта
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Нижняя строка */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    © {currentYear} Мосстройинформ. Все права защищены.
                </div>
                <div>
                    Разработано в рамках хакатона
                </div>
            </div>
        </footer>
    );
}