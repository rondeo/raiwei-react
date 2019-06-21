import React, { Component } from 'react';
import { hashHistory, Link } from 'react-router';
import IceContainer from '@icedesign/container';
import { Feedback, Button, Icon, Pagination, Upload } from "@icedesign/base";
import { CustomTable, SearchBar, TableToolbar} from '../../../../components';
import { DeleteBalloon } from '../../../../components/Balloons';
import { CreateDialog, EditDialog } from '../../../../components/Dialogs';
import IceLabel from '@icedesign/label';
import _ from 'lodash';
import fpmc from 'fpmc-jssdk';
import SettingsForm from './SettingsForm.js';

const Toast = Feedback.toast;
const SplitButton = Button.Split;

export default class TabTable extends Component {

  searchKey = undefined
  columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },{
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },{
      title: 'SN',
      dataIndex: 'sn',
      key: 'sn',
    },{
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
    },
    ,{
      title: 'NB模块',
      render: (value, index, record) => {
        console.log(record)
        if(_.startsWith(record.nb, '0000')){
          return <Icon type="close" size="small" style={{ color: "#FF3333"}} ></Icon>
        }
        return <span><Icon type="select" size="small" style={{ color: "#1DC11D"}} ></Icon></span>
      }
    },
    // {
    //   title: 'GPS',
    //   render: (value, index, record) => {
    //     return <span>[{ record.gps_lat }, { record.gps_lng }]</span>
    //   }
    // },
    {
      title: '网络状态',
      render: (value, index, record) => {
        switch(record.status){
          case 'READY':
            return <span>待激活</span>
          case 'OFFLINE':
            return <IceLabel status="danger">离线</IceLabel>
          case 'ONLINE':
            return <IceLabel status="success">在线</IceLabel>
        }
        return <span>待激活</span>
      }
    },{
      title: '操作',
      key: 'action',
      // width: 250,
      render: (value, index, record) => {
        return (
          <span>
            <Button type="secondary">
              <Link to={`/devices/panel/${record.sn}`} style={ {color: 'white' }}>控制面板</Link>
            </Button>

            &nbsp;
            <EditDialog>
              <SettingsForm index={index}
                record={record}
                handleSubmitOk={this.modifyValues} />
            </EditDialog>
            &nbsp;
            <DeleteBalloon
              handleRemove={() => this.handleRemove(value, index, record)}
            />
          </span>
        );
      },
    },
  ];
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
      total: 0,
      page: 1,
    };
  }
  fetchData = (page) => {
    const q = new fpmc.Query('dvc_device');
    q.page(page, 10);
    if(this.searchKey && this.searchKey != ''){
      q.condition(`name like '%${this.searchKey}%'`)
    }
    q.findAndCount().then(data=>{
      console.log(data)
      this.setState({
        dataSource: data.rows,
        total: data.count,
        page,
      });
    })
    .catch(err => {
      Toast.error(err.message || '系统错误,请稍后重试');
    })
  }
  componentDidMount(){
    this.fetchData(1)
  }

  changePage = (page) =>{
    this.fetchData(page || this.state.page)
  }

  modifyValues = (values, dataIndex) => {
    const { dataSource } = this.state;
    dataSource[dataIndex] = values;
    this.setState({
      dataSource,
    });
  };

  insertNewValues = (values) => {
    let { dataSource, total } = this.state;
    total = total + 1;
    dataSource.unshift(values);
    if(dataSource.length > 10){
      dataSource.pop();
    }
    this.setState({
      dataSource,
      total,
    });
  }

  handleRemove = (value, index, record) => {
    const o = new fpmc.Object('dvc_device');
    o.remove(record.id)
      .then(data => {
        Toast.success('操作成功');
        this.changePage();
      })
      .catch(err => {
        Toast.error(err.message || '系统错误,请稍后重试');
      })

  };

  handleSearch = (obj) => {
    const { key } = obj
    this.searchKey = key
    this.fetchData(1)
  }

  render() {
    return (
      <div className="tab-table">
        <IceContainer>
          <TableToolbar>
            <CreateDialog title="添加设备">
              <SettingsForm handleSubmitOk={this.insertNewValues} />
            </CreateDialog>
            <Upload
              listType="text"
              action="//www.easy-mock.com/mock/5b960dce7db69152d06475bc/ice/upload" // 该接口仅作测试使用，业务请勿使用
              accept="text/*"
              // beforeUpload={beforeUpload}
              // onChange={onChange}
              // onSuccess={onSuccess}
              >
            <Button>导入设备</Button>
            </Upload>
            <SearchBar placeholder="请输入设备名" onSearch={this.handleSearch} />
          </TableToolbar>

          <CustomTable
            dataSource={this.state.dataSource}
            columns={this.columns}
            hasBorder={false}
          />
          <Pagination style={ {marginTop: '5px'} } shape="arrow-only" onChange={this.changePage} total={ this.state.total } pageSize={ 10 }  />
        </IceContainer>
      </div>
    );
  }
}
