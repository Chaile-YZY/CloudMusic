// pages/login/login.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    email: '',//邮箱
    password: ''//密码
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
  },
  handleInput(event) {
    // let type=event.currentTarget.id;
    let type = event.currentTarget.dataset.type;
    this.setData({
      [type]: event.detail.value
    })
  },

  async login() {
    let { email, password } = this.data;
    //前端验证
    if (!email) {
      wx.showToast({
        title: '邮箱账号不能为空！！！',
        icon: 'none',
      })
      return;
    }
    let emailReg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(.[a-zA-Z0-9-]+)*.[a-zA-Z0-9]{2,6}$/;
    if (!emailReg.test(email)) {
      wx.showToast({
        title: '邮箱格式不正确',
        icon: 'none',
      })
      return;
    }
    if (!password) {
      wx.showToast({
        title: '密码不能为空！！！',
        icon: 'none',
      })
      return;
    }

    //后端验证
    let result = await request('/login', { email, password, isLogin: true })
    if (result.code === 200) {
      wx.showToast({
        title: '登录成功',
        icon: 'success',
      })
      // console.log('-------', result);
      //存储用户信息到本地
      console.log("---------", result);
      wx.setStorageSync('userInfo', JSON.stringify(result.profile));
      // 跳转至个人中心personal页面
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/personal/personal'
        })
      }, 2000);
    } else if (result.code === 400) {
      wx.showToast({
        title: '邮箱账号错误！',
        icon: 'none'
      })
    } else if (result.code === 502) {
      wx.showToast({
        title: '密码错误！',
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: '当前账号登录失败，请稍后重试！',
        icon: 'none'
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})