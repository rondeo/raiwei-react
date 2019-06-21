import React, {
  Component
} from 'react';
import {
  Link,
  hashHistory
} from 'react-router';
import {
  Grid,
  Switch,
  Tab,
  Button,
  moment,
  Dialog,
  Feedback,
} from '@icedesign/base';
import CustomBreadcrumb from '../../components/CustomBreadcrumb';
import IceContainer from '@icedesign/container';
import IceLabel from '@icedesign/label';
import CustomTable from '../../components/CustomTable';

import {
  OperateRecord,
  BugNews
} from './components/LatestNews';

import _ from 'lodash'
import PubSub from 'pubsub-js';
import fpmc, {
  Query,
  Func
} from 'fpmc-jssdk';
import UserService from '../../user.js';

import CameraAddDialog from './components/VideoCamera/CameraAddDialog';
import CameraPreview from './components/VideoCamera/CameraPreview';

const {
  Row,
  Col
} = Grid;
const TabPane = Tab.TabPane;
const Toast = Feedback.toast;

moment.locale('zh-cn')
export default class DevicePanel extends Component{

  constructor(props) {
    super(props);
    const {
      sn = 'fffefdfc'
    } = props.params
    this.sn = sn
    this.state = {
      device: {},
      troubles: [],
      alarms: [],
      camera: [],
      switcher: {},
      sensor: {},
      updateAt: '', // 更新时间
      network: '',
      disabled: false,
      time: 0
    }
    this.sensorColumns = [{
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: 130,
        align: 'center',
      },
      {
        title: 'Value',
        dataIndex: 'val',
        key: 'val',
        align: 'left',
        render: (value, index, record) => {
          switch (record.type) {
            case 'Boolean':
              return <span > {
                record.val == 0 ? '关闭' : '打开'
              } </span>
            case 'Onoff':
              return <span > {
                record.val == 0 ? '异常' : '运行'
              } </span>
            case 'Int16':
              return <span > {
                record.val / 10.0
              } </span>
            case 'UInt16':
              return <span > {
                record.val
              } </span>
          }
        }
      },
    ];
    this.switcherColumns = [{
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: 130,
        align: 'center',
      },
      {
        title: 'Value',
        dataIndex: 'val',
        key: 'val',
        align: 'left',
        render: (value, index, record) => {
          return ( <Switch checked = {
              record.val === 1
            }
            onChange = {
              /*send message to controll device*/
              (checked) => this.onSwitcherChange(record, checked)
            }
            disabled={this.state.disabled}
            checkedChildren = "开"
            unCheckedChildren = "关" />
          )
        }
      },
    ]


  }

	getCamera = () => {
	  new Query('dvc_camera')
	    .condition({
	      device_sn: this.sn,
      })
      .sort('id+')
	    .find()
	    .then(data => {
	      this.setState({
	        camera: data
	      });
	    })
	    .catch(console.error);
	}

  onSwitcherChange = (record, checked) => {

    record.val = checked ? 1 : 0
    let data = {}
    data['r' + record.addr] = record
    const switcher = _.assign(this.state.switcher, data)
    this.setState({
      switcher
    })
    // send the command
    new Func('device.send')
      .invoke({
        sn: this.sn,
        unit: record.addr,
        op: 'SET',
        val: record.val,
        uid: UserService.me().getId()
      })
      .then(data => {
        // append the command to history
        const {
          commands
        } = this.state
        commands.unshift({
          nickname: UserService.me().get('nickname'),
          val: record.val,
          unit: record.addr
        })
        this.setState({
          commands
        })
      })
      .catch(console.error)
  }
  componentDidMount() {

    new fpmc.Func('device.send')
      .invoke({
        sn: this.sn, op: 'GET', uid: UserService.me().getId()
      }).then(() =>{
        new fpmc.Func('device.getCacheDevice')
          .invoke({sn: this.sn})
          .then( data => {
            this.setState({
              /*在组件重新渲染的时候就重新设置network*/
              network: data
            })
          })
      }
    )

    // get the device basic info
    new Query('dvc_device')
      .condition(`sn = '${this.sn}'`)
      .first()
      .then(data => {
        console.log(data)
      this.setState({
        device: data.get()
      })
    })
    this.getCamera();
    // Get the registers
    // get latest info of the device
    // the function contains the latest info
    new Func('device.getRegisters').invoke({
        sn: this.sn
      })
      .then((data) => {
        // set data
        const info = {
          sensor: {},
          switcher: {}
        }
        _.map(data, register => {
          const {
            addr,
            rw,
            name
          } = register
          if (name == '保留') {
            return
          }
          if (rw == 3) {
            // switcher
            info.switcher['r' + addr] = register
          } else if (rw == 2) {
            // sensor
            info.sensor['r' + addr] = register
          }
        })
        this.setState(info, () => {

          //Subscrib the device event
          PubSub.subscribe('message', (topic, msg) => {
            if (msg.fn == 'OFFLINE') {
              this.setState({
                device: Object.assign(this.state.device, {
                  status: 'OFFLINE'
                })
              })
              return;
            }
            if( msg.fn == 'ALARM'){
              // alert('error');
              console.log(msg)
              return;
            }
            if (msg.fn == 'ONLINE'){
              this.setState({
                device: Object.assign(this.state.device, {
                  status: 'ONLINE'
                })
              })
              return;
            }
            this.renderInfo(msg)
          })
        })
      })
      .catch(console.error)

    new Query('evt_event')
      .condition(`sn = '${this.sn}' and network = 'TCP'`)
      .sort('createAt-')
      .first()
      .then(data => {
        if(data.data){
          const { createAt } = data.data;
          this.setState({ updateAt: moment(createAt).startOf('hour').fromNow() });
        }
      })
    // get command history
    new Func('device.getCommands').invoke({
        sn: this.sn
      })
      .then((data) => {
        data = data.data
        this.setState({
          commands: data.rows
        })
      })
      .catch(console.error)

    // get the trouble list
    new Query('opt_trouble').condition(`sn = '${this.sn}'`).findAndCount().then(data => {
      this.setState({
        troubles: data.rows
      })
    })

    new Query('dvc_alarm').condition(`sn = '${this.sn}'`).page(1, 20).findAndCount().then(data => {
      this.setState({
        alarms: data.rows
      })
    })
  }

  renderInfo = (msg) => {
    if (msg.sn != this.sn) {
      return;
      // ignore the other device info.
    }
    this.setState({
      updateAt: moment(_.now()).startOf('hour').fromNow()
    })
    if( msg.fn != 'PUSH' && msg.fn != 'SET' && msg.fn != 'GET'){
      return;
    }

    let {
      sensor,
      switcher
    } = this.state;
    _.map(sensor, s => {
      const newValue = msg.registers[s.addr]
      _.extend(s, newValue)
    })
    _.map(switcher, s => {
      const newValue = msg.registers[s.addr]
      _.extend(s, newValue)
    })
    this.setState({
      sensor,
      switcher
    })

  }

  componentWillUnmount() {
    PubSub.unsubscribe('message')
  }

  handleCameraCreateOk = ( cameraInfo ) => {

    const { camera } = this.state;
    camera.push(cameraInfo);
    this.setState({
      camera
    });
  }

  handleFixMode = () => {
    /*在点击维修按钮之后将device fixing: 1 更新进数据库*/
   new Func('device.updateDevice')
    .invoke({
      sn: this.sn,
      fixing: 1,
      op: 'fixing'
    })

    Dialog.confirm({
      content: "进入远程修复模式将无法收到后续的报警信息！是否继续?",
      title: "远程修复模式",
      onOk: async () => {
        try {
          // make the device in fix mode, then the device will not push error/alarm
          await new Func('device.send')
            .invoke({
              sn: this.sn,
              op: 'FIX_MODE',
              uid: UserService.me().getId()
            })
          hashHistory.push(`/devices/fix/${this.sn}`)
        } catch (error) {
          Toast.error(error.message || 'System Error!')
        }
      }
    });
  }

	handleCameraEditOk = ( cameraInfo, index ) => {
    const { camera } = this.state;
    camera[index] = cameraInfo;
    this.setState({
      camera
    });
  }

  render(){
    let timeChange;
    let ti = 10;
    //关键在于用ti取代time进行计算和判断，因为time在render里不断刷新，但在方法中不会进行刷新
    const clock =()=>{
      if (ti > 0) {
        //当ti>0时执行更新方法
        ti = ti - 1;
        this.setState({
          time: ti
        })
        console.log(ti)
      }else {
        //当ti=0时执行终止循环方法
        clearInterval(timeChange);
        /*将按钮能够显示*/
        this.setState({
          disabled: false,
          time: 0
        })
      }
    }

    const sendCode = ()=>{
      //判断当前state.network的状态 如果时tcp return 如果是nb就执行一下的逻辑
      console.log(this.state.time)
      if(this.state.network === 'tcp' || this.state.time > 0) return
      this.setState({
        disabled: true,
      });
      console.log(this.state.disabled)
      //每隔一秒执行一次clock方法
      timeChange = setInterval(clock,1000);
    }

    const breadcrumb = [
        { text: '设备管理', link: '' },
        { text: '控制列表', link: '#/devices/list' },
        { text: '控制面板', link: '' },
      ];
    return (
      <div className="dashboard-page">
        <CustomBreadcrumb dataSource={breadcrumb} />
        <IceContainer style={styles.panel}>
          <h2>{ this.state.device.name }
            <IceLabel
              status={ this.state.device.status == 'ONLINE'? 'success': 'danger' } >{ this.state.device.status == 'ONLINE'? '在线': '异常'}
            </IceLabel>
            <IceLabel
              status={ 'success' } >{ this.state.network == 'tcp' ? 'TCP': 'NB'}
            </IceLabel>
            <IceLabel
              status={ this.state.device.fixing ==  1 ? 'warning': 'default ' } >{ this.state.device.fixing == 1 ? '维修中': undefined}
            </IceLabel>
            <Button type="normal" shape="warning" style={ { float: 'right'}} onClick={ this.handleFixMode } >维修</Button>
          </h2>
          <p>更新于: { this.state.updateAt }</p>
          <Row wrap>
            <Col xxs="24" l="6">

            <IceContainer>
              <h4>传感器 <span style={ { float: 'right'}} >当前状态</span></h4>
              <CustomTable dataSource={ _.values(this.state.sensor) } hasHeader={false} columns={ this.sensorColumns} />
            </IceContainer>

            <IceContainer>
              <h4>控制开关 <span style={ { float: 'right'}} >当前状态</span></h4>
              <CustomTable dataSource={ _.values(this.state.switcher)} hasHeader={false} columns={ this.switcherColumns} onClick={sendCode} />
            </IceContainer>
          </Col>
            <Col xxs="24" l="2"></Col>
            <Col xxs="24" l="16">
              <IceContainer>
                <h4>摄像头</h4>
                <Row wrap>
                {
                  this.state.camera.map( (item, index) => {
                    return (
                      <Col l="8" key={ `Camera_${index}`}>
                        <CameraPreview
                          key={item.id}
                          id={item.id}
                          index={ index }
                          sn={this.sn}
                          info={item}
                          record={item}
                          editOk= { this.handleCameraEditOk }
                        />
                      </Col>
                    )
                    })
                }
                  <Col l="8">
                    <CameraAddDialog
                      sn={this.sn}
                      createOk={ this.handleCameraCreateOk }
                    />
                  </Col>
                </Row>
              </IceContainer>
            </Col>
          </Row>
        </IceContainer>

        <IceContainer>
          <Tab>
            <TabPane tab="告警记录" key="1">
              <BugNews data = { this.state.alarms } state='process'/>
            </TabPane>
            <TabPane tab="故障记录" key="2">
              <BugNews data = { this.state.troubles }/>
            </TabPane>
            <TabPane tab="操作记录" key="4">
              <OperateRecord commands = { this.state.commands } switcher = { this.state.switcher } />
            </TabPane>

          </Tab>
        </IceContainer>
      </div>
    )
  }
}

const styles = {
  panel: {
    'minHeight': '500px',
    // 'background': '#6699CC',
  },
  primaryButton: {
    height: 50,
    fontSize: 16,
    padding: '0 20px',
    lineHeight: '50px',
    color: '#fff',
    marginTop:'80px'
  },
  buttonBox:{
    width:'100%',
    height:'100%',
    textAlign:'center',
	},
	dialog:{
		width : 700,
	},
	addRow:{
		lineHeight:'40px'
	},
	addTitle:{
		textAlign:'right'
	},
	addInput:{
		lineHeight:'100%',
		height:'25px',
		width:'95%'
	},
	addInputMonth:{
		lineHeight:'100%',
		height:'25px',
		width:'80%'
	},
	addSelect:{
		marginTop: 5,
		width: '95%',
  		height: '27px'
	},
	datePicker:{
		width:'95%',
	},
	cameraCol:{
		padding:'5px',
	},
	cameraBox:{
		textAlign:'center',
		// border:'1px solid #000',
		background:'#fafafa',
		minHeight:'200px',
		padding:'15px'
	},
	cameraBtnBox:{
		textAlign:'right'
	},
	cameraBtn:{
		background:'#2ECA9C'
	},
	cameraImg:{
		width:'100px',
		marginTop:'20px',
		cursor:'pointer'
	},
	cameraTextBox:{
		display:'flex',
		flexDirection:'row',
		justifyContent: 'space-between',
		paddingTop:'20px'
	}
}
