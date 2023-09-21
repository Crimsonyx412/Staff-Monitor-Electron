import React, { Component } from 'react';
const Context = React.createContext();
const reducer = (state, action) => {
  switch (action.type) {
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter(
          contact => contact.id !== action.payload
        )
      };
    case 'ADD_CONTACT':
      return {
        ...state,
        contacts: [action.payload, ...state.contacts]
      };
    default:
      return state;
  }
};
export default class Provider extends Component {
  state = {
    contacts: [
      {
        id: 1,
        name: 'Jon Doe',
        email: 'JDoe@gmail.com',
        phone: '1234567890'
      },
      {
        id: 2,
        name: 'Jen Doe',
        email: 'JenDoe@gmail.com',
        phone: '1234567891'
      },
      {
        id: 3,
        name: 'Jasn Doe',
        email: 'JasonDoe@gmail.com',
        phone: '1234567892'
      }
    ],
    dispatch: action => this.setState(state => reducer(state, action))
  };
  render() {
    return (
      <Context.Provider value={this.state}>
        {this.props.children}
      </Context.Provider>
    );
  }
}

export const Consumer = Context.Consumer;
