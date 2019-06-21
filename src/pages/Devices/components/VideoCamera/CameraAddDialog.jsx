import React, {
  Component
} from 'react';
import {
  Button,
  Icon,
  Dialog,
} from '@icedesign/base';


import CameraEditForm from './CameraEditForm.jsx';

export default class CameraAddDialog extends Component{

  constructor(props){
    super(props);
    this.state = {
      visible: false,
    };
  }

  // 弹窗
	onOpen = () => {
		this.setState({
			visible: true
		});
	};

	onClose = () => {
		this.setState({
			visible: false
		});
	};

	handleSubmit = () =>{
    const { handleSubmit } = this.refs.cameraForm;
    handleSubmit();
	}

	handleCreate = () =>{
    this.onOpen();
	}

  render(){
    return(
      <div style={styles.buttonBox}>
        <Button
          type="primary"
          size="large"
          style={styles.primaryButton}
          onClick={this.handleCreate}
        >
          <Icon type="add" />添加监控设备
        </Button>

        <Dialog
          style={styles.dialog}
          visible={this.state.visible}
          onOk={this.handleSubmit}
          closable="esc,mask,close"
          onCancel={this.onClose}
          onClose={this.onClose}
          autoFocus={false}
          title="添加设备"
        >
          <CameraEditForm { ...this.props } onClose={ this.onClose } ref="cameraForm"/>
        </Dialog>

      </div>
    )
  }
}

const styles = {

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
}
