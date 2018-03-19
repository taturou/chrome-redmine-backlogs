import jQuery from 'jquery'
import lodash from 'lodash'

const $ = jQuery
const _ = lodash

// 追加するHTMLタグidのプレフィックス
const idPrefix = '--kanban-'

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
  data['projectId'] = $(overview).attr('href').substr(10) // delete '/projects/'

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
      let featureHeaderBox = $(storyBox).find('.id')[0]
      $(featureHeaderBox).attr('id', `${idPrefix}story_header_box-${featureid}`)

      // Featureチケットへのリンク
      let ticketLink = _.filter($(storyBox).find('a'), (elem) => {
        let href = $(elem).attr('href')
        return /^\/issues\//.test(href)
      })[0]
      $(ticketLink).attr('id', `${idPrefix}story_id_link-${featureid}`)

      // ストーリー名
      let storyName = $(storyBox).find('.subject')[0]
      $(storyName).attr('id', `${idPrefix}story_name-${featureid}`)

      // ストーリーポイント
      let storyPoints = $(storyBox).find('.story_points')[0]
      $(storyPoints).attr('id', `${idPrefix}story_points-${featureid}`)

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
        },
        storyPoints: {
          value: storyPoints.innerText,
          domId: storyPoints.id
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
    let status = {
      opened: {
        box: { domId: columns[1].id }
      },
      planned: {
        box: { domId: columns[2].id }
      },
      working: {
        box: { domId: columns[3].id }
      },
      fixed: {
        box: { domId: columns[4].id }
      },
      closed: {
        box: { domId: columns[5].id }
      },
      wontfix: {
        box: { domId: columns[6].id }
      }
    }
    story['status'] = status
  }

  // task
  for (let story of data['stories']) {
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      let box = $(`#${statusObj.box.domId}`)[0]

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

        // 作業区分
        let processKind = $(taskBox).find('.sagyokubun')[0]
        $(processKind).attr('id', `${idPrefix}process_kind-${taskid}`)

        // 残り時間
        let remainingHours = $(taskBox).find('.remaining_hours')[0]
        $(remainingHours).attr('id', `${idPrefix}remaining_hours-${taskid}`)

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
          },
          processKind: {
            value: processKind.innerText,
            domId: processKind.id
          },
          remainingHours: {
            value: remainingHours.innerText,
            domId: remainingHours.id
          }
        }
        tasks.push(task)
      }
      statusObj['tasks'] = tasks
    }
  }

  callback(data)
}

// ストーリーのスタイルを変更する
function overwriteFeatureBoxCSS (data, css) {
  // story
  for (let story of data['stories']) {
    let elem = $(`#${story.box.domId}`)[0]

    // overwrite
    for (let propaty in css) {
      $(elem).css(propaty, css[propaty])
    }
  }
}

// ストーリーとタスクのIDとかを表示するdivのスタイルを変更する
function overwriteHeaderBoxCSS (data, css) {
  // story
  for (let story of data['stories']) {
    let elem = $(`#${story.headerBox.domId}`)

    // overwrite
    for (let propaty in css) {
      $(elem).css(propaty, css[propaty])
    }

    // task
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      for (let task of statusObj['tasks']) {
        let elem = $(`#${task.headerBox.domId}`)

        // overwrite
        for (let propaty in css) {
          $(elem).css(propaty, css[propaty])
        }
      }
    }
  }
}

// ストーリーポイントのスタイルを変更する
function overwriteStoryPointsCSS (data, css) {
  // story
  for (let story of data['stories']) {
    let elem = $(`#${story.storyPoints.domId}`)[0]

    // overwrite
    for (let propaty in css) {
      $(elem).css(propaty, css[propaty])
    }
  }
}

// ステータスのスタイルを変更する
function overwirteStatusBoxCSS (data, cssObj) {
  // story
  for (let story of data['stories']) {
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      let elem = $(`#${statusObj.box.domId}`)[0]

      // overwrite
      let css = cssObj[status]
      for (let propaty in css) {
        $(elem).css(propaty, css[propaty])
      }
    }
  }
}

// タスクのスタイルを変更する
function overwriteTaskBoxCSS (data, css) {
  // task
  for (let story of data['stories']) {
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      for (let task of statusObj['tasks']) {
        let elem = $(`#${task.box.domId}`)

        // overwrite
        for (let propaty in css) {
          $(elem).css(propaty, css[propaty])
        }
      }
    }
  }
}

// 作業区分のスタイルを変更する
function overwriteProcessKindCSS (data, css) {
  // task
  for (let story of data['stories']) {
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      for (let task of statusObj['tasks']) {
        let elem = $(`#${task.processKind.domId}`)

        // overwrite
        for (let propaty in css) {
          $(elem).css(propaty, css[propaty])
        }
      }
    }
  }
}

// 残り時間のスタイルを変更する
function overwriteRemainingHoursCSS (data, css) {
  // task
  for (let story of data['stories']) {
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      for (let task of statusObj['tasks']) {
        let elem = $(`#${task.remainingHours.domId}`)

        // overwrite
        for (let propaty in css) {
          $(elem).css(propaty, css[propaty])
        }
      }
    }
  }
}

// FeatureIDをクリップボードにコピーするためのボタンを作成する
function createFeatureIdCopyButton (data, callback) {
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
    let button = callback(story)
    let html =
      `<button
      type="button"
      id="${idPrefix}copyToClipboard"
      value="${button.text}"
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
      ${button.title}
      </button>`
    html = html.replace(/\r?\n/g, ' ')
    html = html.replace(/\s+/g, ' ')
    $(ticketLink).after(html)
  }
}

// Featureの子チケット一覧を表示するためのリンクを作成する
function createTaskListOpenLink (data, callback) {
  // story
  for (let story of data['stories']) {
    let ticketLink = $(`#${story.ticketLink.domId}`)

    // 既にボタンを作成していたら何もしない
    try {
      let prev = $(ticketLink).prev()[0]
      if (prev.id === `${idPrefix}link`) {
        continue
      }
    } catch (error) {
    }

    // チケット番号のマージンを削除
    $(ticketLink).css('margin-right', '0px')

    // ボタンを作成
    let a = callback(story)
    let html =
      `<a
      id="${idPrefix}link"
      target="_blank"
      href="${a.link}"
      style="float: right;
            margin:0;
            margin-left: 2px;
            margin-right: 0px;
            font-size: inherit;
            padding: 0px;
            font-weight: normal;
            border-width: 0px;
            background: transparent;
            cursor: pointer;
            user-select: none;
            vertical-align: bottom;"
      >
      ${a.title}
      </a>`
    html = html.replace(/\r?\n/g, ' ')
    html = html.replace(/\s+/g, ' ')
    $(ticketLink).before(html)
  }
}

// TaskIDをクリップボードにコピーするためのボタンを作成する
function createTaskIdCopyButton (data, callback) {
  // task
  for (let story of data['stories']) {
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      for (let task of statusObj['tasks']) {
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
        let button = callback(story, task)
        let html =
          `<button
          type="button"
          id="${idPrefix}copyToClipboard"
          value="${button.text}"
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
          ${button.title}
          </button>`
        html = html.replace(/\r?\n/g, ' ')
        html = html.replace(/\s+/g, ' ')
        $(ticketLink).before(html)
      }
    }
  }
}

// '[プロジェクト名] ストーリー名: タスク名' をクリップボードにコピーするためのボタンを作成する
function createTaskNameCopyButton (data, callback) {
  // task
  for (let story of data['stories']) {
    for (let status in story['status']) {
      let statusObj = story['status'][status]
      for (let task of statusObj['tasks']) {
        let ticketLink = $(`#${task.ticketLink.domId}`)

        // 既にボタンを作成していたら何もしない
        try {
          let next = $(ticketLink).next()[0]
          if (next.id === `${idPrefix}copyToClipboard`) {
            continue
          }
        } catch (error) {
        }

        // チケット番号のマージンを削除
        $(ticketLink).css('margin-right', '0px')

        // ボタンを作成
        let button = callback(story, task)
        let html =
          `<button
          type="button"
          id="${idPrefix}copyToClipboard"
          value="${button.text}"
          style="margin:0;
                margin-left: 2px;
                font-size: inherit;
                padding: 0px;
                font-weight: normal;
                border-width: 0px;
                background: transparent;
                cursor: pointer;
                user-select: none;
                vertical-align: bottom;"
          >
          ${button.title}
          </button>`
        html = html.replace(/\r?\n/g, ' ')
        html = html.replace(/\s+/g, ' ')
        $(ticketLink).after(html)
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

// かんばんを書き換える
function updateKanban () {
  parseKanban((data) => {
    overwriteFeatureBoxCSS(data, {
      'border': '1px solid gray'
    })

    overwriteHeaderBoxCSS(data, {
      'background-color': 'whilte',
      'opacity': '1'
    })

    overwriteStoryPointsCSS(data, {
      'border': '1px solid gray'
    })

    overwirteStatusBoxCSS(data, {
      opened: {},
      planned: { 'background': '#fff3e6' },
      working: { 'background': '#ffe6e8' },
      fixed: { 'background': '#e6ffeb' },
      closed: { 'background': '#e6f4ff' },
      wontfix: { 'background': '#f2f2f2' }
    })

    overwriteTaskBoxCSS(data, {
      'border': '1px solid gray',
      'margin': '4px'
    })

    overwriteProcessKindCSS(data, {
      'border': '1px solid gray'
    })

    overwriteRemainingHoursCSS(data, {
      'border': '1px solid gray'
    })

    createFeatureIdCopyButton(data, (story) => {
      return {
        title: '#',
        text: `#${story.id.value}`
      }
    })

    createTaskListOpenLink(data, (story) => {
      return {
        title: '●',
        link: `/projects/${data.projectId}/issues?utf8=%E2%9C%93&set_filter=1&f%5B%5D=status_id&op%5Bstatus_id%5D=*&f%5B%5D=parent_id&op%5Bparent_id%5D=%3D&v%5Bparent_id%5D%5B%5D=${story.id.value}&f%5B%5D=&c%5B%5D=status&c%5B%5D=tracker&c%5B%5D=cf_271&c%5B%5D=subject&c%5B%5D=assigned_to&c%5B%5D=total_estimated_hours&c%5B%5D=total_spent_hours&group_by=assigned_to&t%5B%5D=estimated_hours&t%5B%5D=spent_hours&t%5B%5D=`
      }
    })

    createTaskIdCopyButton(data, (story, task) => {
      return {
        title: '#',
        text: `#${task.id.value} #${story.id.value}`
      }
    })

    createTaskNameCopyButton(data, (story, task) => {
      return {
        title: '●',
        text: `[${data.projectId}] ${story.name.value}: ${task.name.value}`
      }
    })
  })
}

// 拡張機能の popup から呼ばれる
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.request === 'update') {
    console.log('update: called')
    updateKanban()
    sendResponse({
      msg: 'update: done'
    })
  }
})
