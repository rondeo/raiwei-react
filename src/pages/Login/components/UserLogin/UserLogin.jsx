/* eslint react/no-string-refs:0 */
import React, { Component } from 'react';
import fpmc from 'fpmc-jssdk';
import { hashHistory } from 'react-router';
import { Input, Button, Checkbox, Grid, Feedback } from '@icedesign/base';
import {
  FormBinderWrapper as IceFormBinderWrapper,
  FormBinder as IceFormBinder,
  FormError as IceFormError,
} from '@icedesign/form-binder';
import IceIcon from '@icedesign/icon';
import './UserLogin.scss';
import UserService from '../../../../user.js';

const { Row, Col } = Grid;

const Toast = Feedback.toast;

// 寻找背景图片可以从 https://unsplash.com/ 寻找
const backgroundImage = require('./loginbg.jpeg');

export default class UserLogin extends Component {
  static displayName = 'UserLogin';

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {
      value: {
        account: undefined,
        password: undefined,
        checkbox: false,
      },
    };
  }

  formChange = (value) => {
    this.setState({
      value,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    // Save Into Localstorage
    /*const loginInfo =  {
      id: 1,
      name: 'jt',
      token: '123',
      invalidTime: 0,
      desktop: {
        entry_url: '/user'
      },
      obs: {
        name: 'jt'
      },

    }
    UserService.me().update(loginInfo);
    const { desktop = {} } = loginInfo
    const url = desktop.entry_url || '/'
    hashHistory.push(url);
    return
*/
    this.refs.form.validateAll((errors, values) => {
      if (errors) {
        return;
      }
      new fpmc.Func('statistics.test').invoke().then(data =>{
        console.log(data)
      });

      // check info with fpm client
      new fpmc.Func('user.login')
        .invoke(values)
        .then((loginInfo) => {
          // Save Into Localstorage
          UserService.me().update(loginInfo);
          const { desktop = {} } = loginInfo
          const url = desktop.entry_url || '/'
          hashHistory.push(url);
        })
        .catch((err) => {
          Toast.error(err.message || '用户名或密码错误');
        });
    });
  };

  render() {
    return (
      <div style={styles.userLogin} className="user-login">
        <div
          style={{
            ...styles.userLoginBg,
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
        <div style={styles.contentWrapper} className="content-wrapper">
          <h2 style={styles.slogan} className="slogan">
            欢迎使用 <br /> 瑞威光电控制台
          </h2>
          <div style={styles.formContainer}>
            <h4 style={styles.formTitle}>登录</h4>
            <IceFormBinderWrapper
              value={this.state.value}
              onChange={this.formChange}
              ref="form"
            >
              <div style={styles.formItems}>
                <Row style={styles.formItem}>
                  <Col>
                    <IceIcon
                      type="person"
                      size="small"
                      style={styles.inputIcon}
                    />
                    {/*//name 对应的是formError的name message对应的是报错信息 只要不符合Form的规则信息就会显示FormError信息*/}
                    <IceFormBinder name="account" required message="必填" >
                      <Input maxLength={20} placeholder="用户名" />
                    </IceFormBinder>
                  </Col>
                  <Col>
                    <IceFormError name="account" />
                  </Col>
                </Row>

                <Row style={styles.formItem}>
                  <Col>
                    <IceIcon
                      type="lock"
                      size="small"
                      style={styles.inputIcon}
                    />
                    <IceFormBinder name="password" required message="必填">
                      <Input htmlType="password" placeholder="密码" onPressEnter={this.handleSubmit}/>
                    </IceFormBinder>
                  </Col>
                  <Col>
                    <IceFormError name="password" />
                  </Col>
                </Row>

                <Row style={styles.formItem}>
                  <Col>
                    <IceFormBinder name="checkbox">
                      <Checkbox style={styles.checkbox}>记住账号</Checkbox>
                    </IceFormBinder>
                  </Col>
                </Row>

                <Row style={styles.formItem}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    onClick={this.handleSubmit}
                    style={styles.submitBtn}
                  >
                    登 录
                  </Button>
                </Row>

                {/* <Row className="tips" style={styles.tips}>
                  <a href="/" style={styles.link}>
                    立即注册
                  </a>
                  <span style={styles.line}>|</span>
                  <a href="/" style={styles.link}>
                    忘记密码
                  </a>
                </Row> */}
              </div>
            </IceFormBinderWrapper>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  userLogin: {
    position: 'relative',
    height: '100vh',
  },
  userLoginBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
  },
  formContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '30px 40px',
    background: '#fff',
    borderRadius: '6px',
    boxShadow: '1px 1px 2px #eee',
  },
  formItem: {
    position: 'relative',
    marginBottom: '25px',
    flexDirection: 'column',
  },
  formTitle: {
    margin: '0 0 20px',
    textAlign: 'center',
    color: '#3080fe',
    letterSpacing: '12px',
  },
  inputIcon: {
    position: 'absolute',
    left: '0px',
    top: '3px',
    color: '#999',
  },
  submitBtn: {
    width: '240px',
    background: '#3080fe',
    borderRadius: '28px',
  },
  checkbox: {
    marginLeft: '5px',
  },
  tips: {
    textAlign: 'center',
  },
  link: {
    color: '#999',
    textDecoration: 'none',
    fontSize: '13px',
  },
  line: {
    color: '#dcd6d6',
    margin: '0 8px',
  },
};
