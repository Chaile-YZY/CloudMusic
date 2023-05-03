// pages/search/search.js
import request from '../../utils/request'
let isSend = false;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '',
    hotList: [],
    searchContent: '',
    searchSuggest: [], //搜索建议
    searchList: [], //模糊匹配的数据
    historyList: [],
    showSongResult: true,
    showSearchResult: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获取初始化数据
    this.getInitData();
    //获取历史记录
    this.getSearchHistory();
  },
  //获取初始化数据
  async getInitData() {
    let placeholderData = await request('/search/default'); //默认搜索关键词
    let hotListData = await request('/search/hot/detail'); //详细热搜列表
    this.setData({
      placeholderContent: placeholderData.data.showKeyword,
      hotList: hotListData.data,
    })
  },
  //获取本地历史记录的功能函数
  getSearchHistory() {
    let historyList = wx.getStorageSync('searchHistory');
    if (historyList) {
      this.setData({
        historyList: historyList,
      })
    }
  },
  HandleInputChange(event) {
    // console.log(event);
    // 更新searchContent的状态数据
    this.setData({
      searchContent: event.detail.value.trim(),
    })
    if (isSend) {
      return
    }
    isSend = true;
    this.getSearchSuggest();
    this.getSearchList();
    this.getSearchHistory();
    setTimeout(() => {
      isSend = false;
    }, 300)
  },
  async getSearchList() {
    if (!this.data.searchContent) {
      this.setData({
        searchList: []
      })
      return;
    }
    let {
      searchContent,
      historyList
    } = this.data;
    //获取关键字模糊匹配数据
    let searchListData = await request('/search', {
      keywords: searchContent,
      limit: 50,
      offset: 2,
    });
    this.setData({
      searchList: searchListData.result.songs,
    })
    // 将搜索的关键字添加到搜索历史记录中
    if (historyList.indexOf(searchContent) !== -1) {
      historyList.splice(historyList.indexOf(searchContent), 1)
    }
    historyList.unshift(searchContent);
    this.setData({
      historyList: historyList,
    })
    wx.setStorageSync('searchHistory', historyList)
  },
  async getSearchSuggest() {
    if (!this.data.searchContent) {
      this.setData({
        searchSuggest: []
      })
      return;
    }
    let searchContent = this.data.searchContent;
    let searchSuggestData = await request('/search/suggest', {
      keywords: searchContent,
      type: 'mobile',
    })
    this.setData({
      searchSuggest: searchSuggestData.result.allMatch
    })
  },
  handlePlayAudio(e) {
    const musicId = e.currentTarget.dataset.id;
    this.setData({
      musicId: musicId,
    })
    console.log('当前的musicId:' + musicId);
    wx.navigateTo({
      url: `/SongPackage/pages/songDetail/songDetail?musicId=${musicId}`,
    })
  },
  showSearchResult() {
    this.setData({
      showSongResult: false,
      showSearchResult: false,
    })
  },
  clearSearchContent() {
    this.setData({
      searchContent: '',
      searchList: [],
    })
  },
  cancel() {
    this.setData({
      searchContent: '',
      searchList: [],
    })
  },
  // 删除搜索历史记录
  deleteSearchHistory() {
    wx.showModal({
      content: '确认删除吗?',
      success: (res) => {
        if (res.confirm) {
          // 清空data中historyList
          this.setData({
            historyList: []
          })
          // 移除本地的历史记录缓存
          wx.removeStorageSync('searchHistory');
        }
      }
    })

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