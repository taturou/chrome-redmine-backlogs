import jQuery from 'jquery'
const $ = jQuery

// 追加するHTMLタグidのプレフィックス
const idPrefix = '--pjpex-'

// このスクリプトがロードされたときに表示する（デバッグ用）
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

// かんばんのHTMLをパースして、各要素のHTMLタグのid一覧を返す
function parseKanban (callback) {
  let data = {}

  // project id
  let overview = $('#main-menu').find('.overview')
  data['project_id'] = $(overview).attr('href').substr(10) // delete '/projects/'

  // story
  data['stories'] = []
  let swimlanes = $('[id^=swimlane-')
  swimlanes.each((i, swimlane) => {
    try {
      let featureid = swimlane.id.slice(9) // delete 'swimlane-'

      // ストーリーの情報を格納するdiv
      let storyBox = $(swimlane).find('.story')[0]
      $(storyBox).attr('id', `${idPrefix}story_box-${featureid}`)

      // FeatureIDとか表示するdiv
      let featureHeaderBox = $(storyBox).children()[0]
      $(featureHeaderBox).attr('id', `${idPrefix}story_header_box-${featureid}`)

      // Featureチケットへのリンク
      let ticketLink = $(storyBox).find('a')[0]
      $(ticketLink).attr('id', `${idPrefix}story_id_link-${featureid}`)

      // ストーリー名
      let storyName = $(storyBox).find('.subject')[0]
      $(storyName).attr('id', `${idPrefix}story_name-${featureid}`)

      // make object
      let story = {
        id: {
          value: featureid
        },
        name: {
          value: storyName.innerText,
          domId: storyName.id
        },
        swimlane: {
          domId: swimlane.id
        },
        box: {
          domId: storyBox.id
        },
        headerBox: {
          domId: featureHeaderBox.id
        },
        ticketLink: {
          value: ticketLink.innerText,
          domId: ticketLink.id
        }
      }
      data['stories'].push(story)
    } catch (error) {
      console.log(error)
    }
  })

  // status
  for (let story of data['stories']) {
    let swimlane = $(`#${story.swimlane.domId}`)
    let columns = $(swimlane).children()

    // make object
    let status = [
      {
        status: 'opened',
        box: { domId: columns[1].id }
      },
      {
        status: 'planned',
        box: { domId: columns[2].id }
      },
      {
        status: 'working',
        box: { domId: columns[3].id }
      },
      {
        status: 'fixed',
        box: { domId: columns[4].id }
      },
      {
        status: 'closed',
        box: { domId: columns[5].id }
      },
      {
        status: 'wontfix',
        box: { domId: columns[6].id }
      }
    ]
    story['status'] = status
  }

  // task
  for (let story of data['stories']) {
    for (let status of story['status']) {
      let box = $(`#${status.box.domId}`)[0]

      let taskBoxs = $(box).children()

      // task
      let tasks = []
      for (let taskBox of taskBoxs) {
        let taskid = taskBox.id.slice(6)

        // TaskIDとか表示するdiv
        let taskHeaderBox = $(taskBox).children()[0]
        $(taskHeaderBox).attr('id', `${idPrefix}task_header_box-${taskid}`)

        // Taskチケットへのリンク
        let ticketLink = $(taskBox).find('a')[0]
        $(ticketLink).attr('id', `${idPrefix}task_id_link-${taskid}`)

        // タスク名
        let taskName = $(taskBox).find('.subject')[0]
        $(taskName).attr('id', `${idPrefix}task_name-${taskid}`)

        // make object
        let task = {
          id: {
            value: taskid
          },
          name: {
            value: taskName.innerText,
            domId: taskName.id
          },
          box: {
            domId: taskBox.id
          },
          headerBox: {
            domId: taskHeaderBox.id
          },
          ticketLink: {
            value: ticketLink.innerText,
            domId: ticketLink.id
          }
        }
        tasks.push(task)
      }
      status['tasks'] = tasks
    }
  }

  callback(data)
}

// ストーリーとタスクのIDとかを表示するdivの背景色を変更する
function overwriteHeaderBoxCSS (data, css) {
  // story
  for (let story of data['stories']) {
    let storyHeaderBox = $(`#${story.headerBox.domId}`)

    // overwrite
    for (let propaty in css) {
      $(storyHeaderBox).css(propaty, css[propaty])
    }

    // task
    for (let status of story['status']) {
      for (let task of status['tasks']) {
        let taskHeaderBox = $(`#${task.headerBox.domId}`)

        // overwrite
        for (let propaty in css) {
          $(taskHeaderBox).css(propaty, css[propaty])
        }
      }
    }
  }
}

// FeatureIDをクリップボードにコピーするためのボタンを作成する
function createFeatureIdCopyButton (data) {
  // story
  for (let story of data['stories']) {
    let ticketLink = $(`#${story.ticketLink.domId}`)

    // 既にボタンを作成していたら何もしない
    try {
      let next = $(ticketLink).next()[0]
      if (next.id === `${idPrefix}copyToClipboard`) {
        continue
      }
    } catch (error) {
    }

    // チケット番号のマージンを削除
    $(ticketLink).css('margin-left', '0px')

    // ボタンを作成
    let html =
      `<button
      type="button"
      id="${idPrefix}copyToClipboard"
      value="#${story.id.value}"
      style="float: right;
            margin:0;
            margin-left: 4px;
            margin-right: 2px;
            font-size: inherit;
            padding: 0px;
            font-weight: normal;
            border-width: 0px;
            background: transparent;
            cursor: pointer;
            user-select: none;
            vertical-align: bottom;"
      >
      #
      </button>`
    html = html.replace(/\r?\n/g, ' ')
    html = html.replace(/\s+/g, ' ')
    $(ticketLink).after(html)
  }
}

// TaskIDをクリップボードにコピーするためのボタンを作成する
function createTaskIdCopyButton (data) {
  // task
  for (let story of data['stories']) {
    for (let status of story['status']) {
      for (let task of status['tasks']) {
        let ticketLink = $(`#${task.ticketLink.domId}`)

        // 既にボタンを作成していたら何もしない
        try {
          let prev = $(ticketLink).prev()[0]
          if (prev.id === `${idPrefix}copyToClipboard`) {
            continue
          }
        } catch (error) {
        }

        // チケット番号のマージンを削除
        $(ticketLink).css('margin-left', '0px')

        // ボタンを作成
        let html =
          `<button
          type="button"
          id="${idPrefix}copyToClipboard"
          value="#${task.id.value} #${story.id.value}"
          style="margin:0;
                margin-right: 2px;
                font-size: inherit;
                padding: 0px;
                font-weight: normal;
                border-width: 0px;
                background: transparent;
                cursor: pointer;
                user-select: none;
                vertical-align: bottom;"
          >
          #
          </button>`
        html = html.replace(/\r?\n/g, ' ')
        html = html.replace(/\s+/g, ' ')
        $(ticketLink).before(html)
      }
    }
  }
}

// ボタンが押されたら、クリップボードにコピー
$(document).on('click', `#${idPrefix}copyToClipboard`, (e) => {
  let string = e.target.value

  // Shiftキーが押されていたら、先頭からスペースまでをコピー
  if (e.shiftKey) {
    string = string.replace(/ .*$/, '')
  }
  execCopy(string)
})

/*
// タイトルをクリップボードにコピーするためのボタンを作成する
function createIdTitleButton () {
  // 既にボタンを作成していたら、全て削除する
  let hoges = $('[id=copyTitleButton]')
  hoges.each((i, elem) => {
    $(elem).remove()
  })

  // Taskチケットを全て取得
  let issues = $('[id^=issue_]')
  issues.each((i, elem) => {
    try {
      // Taskチケットの親の親が「StoryとTask群を含む行」
      let swimlane = ($(elem).parent().parent())[0]
      if (swimlane.id === '') {
        return true
      }
      let story = ($(swimlane).children())[0]
      let storyname = ($(story).find('.subject'))[0].innerText
      let taskname = $(elem).find('div[fieldlabel="題名"]')[0].innerText

      // タイトルをコピーするボタンを作成
      let html =
        `<button
          type="button"
          id="copyTitleButton"
          value="${storyname}: ${taskname}"
          style="display:inline-block;
                margin:0;
                margin-left: 0.5em;
                font-size:inherit;
                padding:0px;
                font-weight:normal;
                border-width:0px;
                border-style:solid;
                background:transparent;
                border-radius:0;
                cursor:pointer;
                user-select:none;
                vertical-align:bottom;">
          ■
          </button>`
      $(elem).find('.prevent_edit').after(html.replace(/\r?\n/g, ' '))
    } catch (error) {
      console.log(error)
    }
  })
}
*/

/*
// ボタンが押されたら、クリップボードにコピー
$(document).on('click', '#copyTitleButton', (e) => {
  let string = e.target.value // ノーマル
  // let string = e.target.parentElement.parentElement.value // 絵文字
  execCopy(string)
  console.log(string)
})
*/

/*
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
    try {
      let featureid = swimlane.id.slice(9)
      let story = $(swimlane).find('.story')

      let html =
        `<a
          id="openChildIdList"
          target="_blank"
          href="/issues?fv%5Bparent_id%5D%5B%5D=${featureid}&f%5B%5D=&c%5B%5D=status&c%5B%5D=tracker&c%5B%5D=cf_271&c%5B%5D=subject&c%5B%5D=assigned_to&c%5B%5D=total_estimated_hours&c%5B%5D=total_spent_hours&group_by=assigned_to&t%5B%5D=estimated_hours&t%5B%5D=spent_hours&t%5B%5D="
        >
        ●
        </a>`
      $(story).find('a').before(html.replace(/\r?\n/g, ' '))
    } catch (error) {
      console.log(error)
    }
  })
}
*/

// 拡張機能の popup から呼ばれる
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('content: called')

  parseKanban((data) => {
    overwriteHeaderBoxCSS(data, {
      'background-color': 'whilte',
      'opacity': '1'
    })

    createFeatureIdCopyButton(data)
    createTaskIdCopyButton(data)
  })
  /*
  createOpenChildIdList()
  createIdTitleButton()
  createIdCopyButton()
  */
  sendResponse({
    msg: 'content: called'
  })
})
