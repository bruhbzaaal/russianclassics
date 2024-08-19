import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import React, { useState } from 'react';
import './App.css';
import classics from './classics.json';

const initializeAssistant = (getState) => {
    if (process.env.NODE_ENV === 'development') {
        return createSmartappDebugger({
            token: process.env.REACT_APP_TOKEN ?? '',
            initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
            getState,
        });
    } else {
        return createAssistant({ getState });
    }
};

export class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedClassic: null,
        };

        // Инициализация ассистента, если это необходимо
        this.assistant = initializeAssistant(() => this.getStateForAssistant());

        this.assistant.on('data', (event) => {
            console.log(`assistant.on(data)`, event);
            if (event.type === 'character') {
                console.log(`assistant.on(data): character: "${event?.character?.id}"`);
            } else if (event.type === 'insets') {
                console.log(`assistant.on(data): insets`);
            } else {
                const { action } = event;
                this.dispatchAssistantAction(action);
            }
        });

        this.assistant.on('start', (event) => {
            let initialData = this.assistant.getInitialData();
            console.log(`assistant.on(start)`, event, initialData);
        });

        this.assistant.on('command', (event) => {
            console.log(`assistant.on(command)`, event);
        });

        this.assistant.on('error', (event) => {
            console.log(`assistant.on(error)`, event);
        });

        this.assistant.on('tts', (event) => {
            console.log(`assistant.on(tts)`, event);
        });
    }

    getStateForAssistant() {
        return {
            classic: {
                selectedClassic: this.state.selectedClassic,
            },
        };
    }

    dispatchAssistantAction(action) {
        console.log('dispatchAssistantAction', action);
        if (action) {
            switch (action.type) {
                case 'go_back':
                    return this.goBack();

                case 'read_facts':
                    return this.readFacts();

                case 'choose_author':
                    return this.chooseAuthor(action);

                default:
                    console.error(`Unknown action type: ${action.type}`);
            }
        }
    }

    _send_action_value(action_id, value) {
        const data = {
            action: {
                action_id: action_id,
                parameters: {
                    value: value,
                },
            },
        };
        const unsubscribe = this.assistant.sendData(data, (data) => {
            const { type, payload } = data;
            console.log('sendData onData:', type, payload);
            unsubscribe();
        });
    }

    goBack() {
        this.setState({ selectedClassic: null });
    }

    readFacts() {
        if (this.state.selectedClassic) {
            // Преобразуем массив фактов в строку, где предложения разделены точками
            const factsString = this.state.selectedClassic.facts.join(' '); 

            // Передаем строку с фактами в ассистента
            this._send_action_value('read_f', factsString);
            console.log(factsString);
        } else {
            console.error('No classic selected');
        }
    }

    chooseAuthor(action) {
        const name = action.answer.trim().toLowerCase();
        console.log('Choosing author:', name);

        // Перебираем список авторов и сравниваем имена
        const selectedClassic = classics.find((classic) =>
            classic.name.toLowerCase() === name
        );

        if (selectedClassic) {
            console.log('Selected classic:', selectedClassic);
            this.setState({ selectedClassic });
            this._send_action_value('no_author', 'Вот несколько фактов про этого писателя.');
        } else {
            this._send_action_value('no_author', 'Автор с именем ' + action.answer + ' не найден.');
            console.error(`Автор с именем "${action.answer}" не найден.`);
        }
    }

    handleClick = (index) => {
        const selectedClassic = classics[index];
        this.setState({ selectedClassic });
    };

    render() {
        const { selectedClassic } = this.state;

        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                default:
                    { };
            }
        });

        return (
            <div className="App">
                <header className="App-header">
                    <h1>Русские классики</h1>
                    <p>Нажмите на имя писателя, чтобы узнать о нем интересные факты</p>
                </header>
                <div className="content">
                    {!selectedClassic && (
                        <ul className="classics-list">
                            {classics.map((classic, index) => (
                                <li key={index} onClick={() => this.handleClick(index)}>
                                    {classic.name}
                                </li>
                            ))}
                        </ul>
                    )}
                    {selectedClassic && (
                        <div className="classic-details">
                            <div className="navigation">
                                <button onClick={() => this.goBack()}>Назад</button>
                            </div>
                            <h2>{selectedClassic.name}</h2>
                            <ul className="classic-facts">
                                {selectedClassic.facts.map((fact, index) => (
                                    <li key={index}>{fact}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default App;
