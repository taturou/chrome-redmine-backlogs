import jQuery from 'jquery'
const $ = jQuery

console.log('PJP, content-script!')

// クリップボードに文字列をコピーする
// https://qiita.com/simiraaaa/items/2e7478d72f365aa48356
function execCopy (string) {
  let temp = document.createElement('div')
  temp.appendChild(document.createElement('pre')).textContent = string

  let s = temp.style
  s.position = 'fixed'
  s.left = '-100%'

  document.body.appendChild(temp)
  document.getSelection().selectAllChildren(temp)
  let result = document.execCommand('copy')

  document.body.removeChild(temp)
  return result // true なら実行できている falseなら失敗か対応していないか
}

// IDをクリップボードにコピーするためのボタンを作成する
function createIdCopyButton () {
  // 既にボタンを作成していたら、全て削除する
  let hoges = $('[id=copyIdButton]')
  hoges.each((i, elem) => {
    $(elem).remove()
  })

  // Taskチケットを全て取得
  let issues = $('[id^=issue_]')
  issues.each((i, elem) => {
    // Taskチケットの親の親が「StoryとTask群を含む行」
    let swimlane = $(elem).parent().parent()
    let featureid = swimlane[0].id.slice(9)
    let taskid = elem.id.slice(6)

    // Task IDの右隣に「#」ボタンを作成
    // これをクリックすると Story ID と Task ID がクリップボードにコピーされる
    let html = `<button type="button" id="copyIdButton" value="#${taskid} #${featureid}" style="
    display:inline-block;
    margin:0 0 0 0.5em;
    font-size:inherit;
    padding:0px;
    font-weight:normal;
    border-width:0px;
    border-style:solid;
    background:transparent;
    border-radius:1em;
    cursor:pointer;
    user-select:none;
    vertical-align:bottom;
    ">#</button>`
    $(elem).find('.prevent_edit').after(html)
  })
}

// ボタンが押されたら、クリップボードにコピー
$(document).on('click', '#copyIdButton', (e) => {
  execCopy(e.target.value)
  console.log(e.target.value)
})

// 子チケット一覧を表示するためのボタンを作成する
function createOpenChildIdList () {
  // 既にボタンを作成していたら、全て削除する
  let hoges = $('[id=openChildIdList]')
  hoges.each((i, elem) => {
    $(elem).remove()
  })

  // Featureチケットを全て取得
  let swimlanes = $('[id^=swimlane-')
  swimlanes.each((i, swimlane) => {
    let featureid = swimlane.id.slice(9)
    let story = $(swimlane).find('.story')

    let html = `<a id="openChildIdList" target="_blank" href="/issues?fv%5Bparent_id%5D%5B%5D=${featureid}&f%5B%5D=&c%5B%5D=status&c%5B%5D=tracker&c%5B%5D=cf_271&c%5B%5D=subject&c%5B%5D=assigned_to&c%5B%5D=total_estimated_hours&c%5B%5D=total_spent_hours&group_by=assigned_to&t%5B%5D=estimated_hours&t%5B%5D=spent_hours&t%5B%5D=">L</a>`
    $(story).find('a').after(html)
  })
}

// 拡張機能の popup から呼ばれる
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('content: called')
  createOpenChildIdList()
  createIdCopyButton()
  sendResponse({msg: 'content: called'})
})
