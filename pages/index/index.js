import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [],//轮播图数据
    recommandList: [],//推荐歌单数据
    TopList: [],//排行榜数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    //获取轮播图
    let bannerListData = await request('/banner', { type: 2 })
    this.setData({
      bannerList: bannerListData.banners
    })
    //获取歌单
    let recommandListData = await request('/personalized', { limit: 10 })
    this.setData({
      recommandList: recommandListData.result
    })
    //获取排行榜数据
    let TData = [];
    let Tops = await request('/toplist');
    for (let i = 0; i < 5; i++) {
      let result = await request('/playlist/track/all', { id: Tops.list[i].id, limit: 3 });
      let TopListItem = {
        id: Tops.list[i].id,
        name: Tops.list[i].name,
        tracks: result.songs
      };
      TData.push(TopListItem);
      this.setData({
        TopList: TData
      })
    }
    // this.setData({
    //   TopList: resultArr
    // })
  },
  ToRecommand() {
    wx.navigateTo({
      url: '/SongPackage/pages/recommandSong/recommandSong',
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
