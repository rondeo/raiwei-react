import React, { PureComponent } from 'react';
import { Link } from 'react-router';

const logo = require('./logo.png');

export default class Logo extends PureComponent {
  render() {
    return (
      <div className="logo" style={{ background: `url(${logo})` }}>
        <Link to="/" className="logo-text">
        </Link>
      </div>
    );
  }
}
