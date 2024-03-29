import React, { PureComponent } from 'react';
import { Balloon, Icon, Badge } from '@icedesign/base';
import IceImg from '@icedesign/img';
import Layout from '@icedesign/layout';
import Menu from '@icedesign/menu';
import FoundationSymbol from 'foundation-symbol';
import IceNotification from '@icedesign/notification';
import cx from 'classnames';
import { Link } from 'react-router';
import { headerNavs } from '../navs';
import Logo from './Logo';
import UserService from '../user.js';
import Alarm from '../pages/Alarm'
import fpmc, { Query } from 'fpmc-jssdk';
import PubSub from 'pubsub-js';

const avatar = require('./avatar.png');
export default class Header extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      alarms: 0,
    }
  }

  logout(e){
    UserService.me().logout()
  }

  componentDidMount() {
    // get the trouble list
    new Query('opt_trouble')
      .condition(`status in (0, 1)`)
      .count()
      .then(count => {
        this.setState({
          alarms: count
        })
    })
    PubSub.subscribe('message', (topic, msg) => {
      if(msg.fn === 'PUSH') return;
      console.log(msg)
      const { alarms } = this.state;
      switch(msg.fn){
        case 'ALARM':
          IceNotification.error({
            message: '设备报警',
            description:
              `编号[${msg.sn}]${msg.name}设备: ${ msg.title }`,
          });
          return;
       /* case 'CAMERA_TROUBLE':
          IceNotification.error({
            message: '监控报警',
            description:
              `IP为[${msg.ip}]的设备: 网络异常`,
          });
          return;*/
        case 'TROUBLE':
        this.setState({
          alarms: alarms + 1,
        })
        IceNotification.error({
          message: '设备异常',
          description:
            `编号[${msg.sn}]${msg.name}设备: ${ msg.title }`,
        });
        return;
        case 'TROUBLE_FIX':
        this.setState({
          alarms: alarms - 1,
        })
        return;
      }
      //
    });
  }
  componentWillUnmount(){
    PubSub.unsubscribe('message')
  }

  render() {
    const { width, theme, isMobile, className, style, ...others } = this.props;

    return (
      <Layout.Header
        {...others}
        theme={theme}
        className={cx('ice-design-layout-header', className)}
        style={{ ...style, width }}
      >
        <Logo />
        <div
          className="ice-design-layout-header-menu"
          style={{ display: 'flex' }}
        >
          <Menu mode="horizontal" selectedKeys={[]}>
            <Menu.Item key={'alarm'}>
              <Alarm badgeCount={ this.state.alarms } icon={'bangzhu'} text={'告警'} />
            </Menu.Item>
          </Menu>
          {/* Header 菜单项 begin */}
          {headerNavs && headerNavs.length > 0 ? (
            <Menu mode="horizontal" selectedKeys={[]}>
              {headerNavs.map((nav, idx) => {
                const linkProps = {};
                if(nav.balloon){
                  return(
                    <Menu.Item key={idx}>
                      <Alarm icon={nav.icon} text={nav.text} />
                    </Menu.Item>
                  )
                }else if(nav.newWindow) {
                  linkProps.href = nav.to;
                  linkProps.target = '_blank';
                } else if (nav.external) {
                  linkProps.href = nav.to;
                } else {
                  linkProps.to = nav.to;
                }
                return (
                  <Menu.Item key={idx}>
                    <Link {...linkProps}>
                      {nav.icon ? (
                        <FoundationSymbol type={nav.icon} size="small" />
                      ) : null}
                      {!isMobile ? nav.text : null}
                    </Link>
                  </Menu.Item>
                );
              })}
            </Menu>
          ) : null}
          {/* Header 菜单项 end */}

          {/* Header 右侧内容块 */}

          <Balloon
            trigger={
              <div
                className="ice-design-header-userpannel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                <IceImg
                  height={40}
                  width={40}
                  src={avatar}
                  className="user-avatar"
                />
                <div className="user-profile">
                  <span className="user-name" style={{ fontSize: '13px' }}>
                    { this.props.nickname || '管理员'}
                  </span>
                  <br />
                  <span
                    className="user-department"
                    style={{ fontSize: '12px', color: '#999' }}
                  >
                    { this.props.dept || '运检部'}
                  </span>
                </div>
                <Icon
                  type="arrow-down-filling"
                  size="xxs"
                  className="icon-down"
                />
              </div>
            }
            closable={false}
            className="user-profile-menu"
          >
            <ul>
              <li className="user-profile-menu-item">
                <Link to="/profile">
                  <FoundationSymbol type="repair" size="small" />设置
                </Link>
              </li>
              <li className="user-profile-menu-item">
                <Link to="/user/pwd">
                  <FoundationSymbol type="key" size="small" />修改密码
                </Link>
              </li>
              <li className="user-profile-menu-item">
                <Link onClick={this.logout} to="/login">
                  <FoundationSymbol type="compass" size="small" />退出
                </Link>
              </li>
            </ul>
          </Balloon>
        </div>
      </Layout.Header>
    );
  }
}
