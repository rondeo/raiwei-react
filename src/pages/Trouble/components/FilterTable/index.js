/* eslint no-underscore-dangle: 0 */
import React, { Component } from 'react';
import { moment, Pagination, Dialog } from '@icedesign/base';
import IceLabel from '@icedesign/label';
import IceContainer from '@icedesign/container';
import FilterForm from './Filter';
import { CustomTable } from '../../../../components';
import { DispatchForm } from '../../../Worksheet';

import { Query } from 'fpmc-jssdk';

export default class extends Component {

  constructor(props) {
    super(props);

    // 请求参数缓存
    this.queryCache = {};
    this.state = {
      filterFormValue: {},
      visible: false,
      tableData: {
        total: 0,
        pageSize: 10,
        currentPage: 1,
        list: []
      }
    };

    this.columns = [
      {
        title: '点位名称',
        dataIndex: 'device',
        key: 'device',
      },
      {
        title: '设备SN',
        dataIndex: 'sn',
        key: 'sn',
      },
      {
        title: '等级',
        dataIndex: 'level',
        key: 'level',
        render: (value, index, record)=>{
          if(record.level == 1)
            return <IceLabel inverse={false} status="danger">异常</IceLabel>;
          return  <IceLabel inverse={false} status="warning">告警</IceLabel>;
        }
      },
      {
        title: '问题描述',
        dataIndex: 'message',
        key: 'message',
        width: 150,
      },
      {
        title: '告警时间',
        dataIndex: 'createAt',
        key: 'createAt',
        width: 150,
        render: (value, index, record)=>{
          return moment(parseInt(record.createAt)).format('YYYY-MM-DD HH:mm');
        }
      },
      {
        title: '修复时间',
        dataIndex: 'fixAt',
        key: 'fixAt',
        width: 150,
        render: (value, index, record)=>{
          if(record.status == 2)
            return moment(parseInt(record.fixAt)).format('YYYY-MM-DD HH:mm');
          return '-'
        }
      },
      // {
      //   title: '修复耗时',
      //   render: (value, index, record) =>{
      //     if(record.status == 2)
      //       return '' + ((record.fixAt - record.createAt )/ 1000 / 60 / 60).toFixed(1) + ' H';
      //     return '-'
      //   }
      // },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (value, index, record) =>{
          if(record.status == 0)
            return <IceLabel inverse={false} status="default">待处理</IceLabel>;
          if(record.status == 1)
            return <IceLabel inverse={false} status="primary">处理中</IceLabel>;
          return <IceLabel inverse={false} status="success">已处理</IceLabel>
        }
      },
      {
        title: '操作',
        render: this.renderOperations
      },
    ];
  }

  componentDidMount() {
    this.queryCache.page = 1;
    this.fetchData();
  }

  fetchData = () => {
    const { startTime, endTime, status, level } = this.queryCache;
    console.log(status)
    let condition = ' 1 = 1 ';
    if(startTime){
      condition += ` and createAt >= ${ startTime }`;
    }
    if(endTime){
      condition += ` and createAt <= ${ endTime }`;
    }
    if(status){
      condition += ` and status = ${ status }`;
    }
    if(level){
      condition += ` and level = ${ level }`;
    }
    new Query('opt_trouble')
      .condition(condition)
      .page(this.queryCache.page, 10)
      .sort('createAt-')
      .findAndCount()
      .then(rsp => {
        this.setState({
          tableData: {
            total: rsp.count,
            pageSize: 10,
            currentPage: this.queryCache.page,
            list: rsp.rows
          }
        })
      })
  };

  renderTitle = (value, index, record) => {
    return (
      <div style={styles.titleWrapper}>
        <span style={styles.title}>{record.title}</span>
      </div>
    );
  };

  showDialog = () => {
    this.setState({
      visible: true,
    });
  };

  onDispatch = () => {
    // dispatch
    const { handleSubmit } = this.refs.dispatchForm;
    handleSubmit();
  }

  onDispatchOk = (index, data) => {
    const { tableData } = this.state;
    const { list } = tableData;
    list[index].status = 1;
    this.hideDialog();

  }

  hideDialog = () => {

    this.setState({
      visible: false,
    });
  };


  renderOperations = (value, index, record) => {

    if( record.status == 0)
      return (

      <div
        className="filter-table-operation"
        style={styles.filterTableOperation}>
        <a
          href="#"
          style={styles.operationItem}
          onClick={ (e) => {
            e.preventDefault();
            this.setState({
              currentTrouble: record,
              currentIndex: index
            })
            this.showDialog()
          }}
        >
          派单
        </a>
      </div>
    );

  };

  renderStatus = (value) => {
    return (
      <div inverse={false} status="default">
        {value}
      </div>
    );
  };

  changePage = (currentPage) => {
    this.queryCache.page = currentPage;

    this.fetchData();
  };

  filterFormChange = (value) => {
    this.setState({
      filterFormValue: value,
    });
  };

  filterTable = () => {
    // 合并参数，请求数据
    this.queryCache = {
      ...this.queryCache,
      ...this.state.filterFormValue,
    };
    this.fetchData();
  };

  resetFilter = () => {
    this.setState({
      filterFormValue: {},
    });
  };

  render() {
    const { filterFormValue, tableData } = this.state;
    return (
      <div className="filter-table">
        <IceContainer title="">
          <FilterForm
            value={filterFormValue}
            onChange={this.filterFormChange}
            onSubmit={this.filterTable}
            onReset={this.resetFilter}
          />
        </IceContainer>
        <Dialog
          visible={this.state.visible}
          onOk={this.onDispatch}
          // style={{minWidth:'70%'}}
          closable="esc,mask,close"
          onCancel={this.hideDialog}
          onClose={this.hideDialog}
        >
          <DispatchForm ref="dispatchForm" index={ this.state.currentIndex } trouble= { this.state.currentTrouble } createOk= { this.onDispatchOk }/>
        </Dialog>
        <IceContainer>
          <CustomTable
            dataSource={tableData.list}
            className="basic-table"
            style={styles.basicTable}
            columns={this.columns}
            hasBorder={false}
          >

          </CustomTable>
          <div style={styles.paginationWrapper}>
            <Pagination
              current={tableData.currentPage}
              pageSize={tableData.pageSize}
              total={tableData.total}
              onChange={this.changePage}
            />
          </div>
        </IceContainer>
      </div>
    );
  }
}

const styles = {
  filterTableOperation: {
    lineHeight: '28px',
  },
  operationItem: {
    marginRight: '12px',
    textDecoration: 'none',
    color: '#5485F7',
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'row',
  },
  title: {
    marginLeft: '10px',
    lineHeight: '20px',
  },
  paginationWrapper: {
    textAlign: 'right',
    paddingTop: '26px',
  },
};
