/* @flow */

import { createAction } from 'redux-actions'
import paratii from 'utils/ParatiiLib'

import {
  UPLOAD_REQUESTED,
  UPLOAD_PROGRESS,
  UPLOAD_REMOTE_SUCCESS,
  UPLOAD_LOCAL_SUCCESS,
  VIDEO_DATA_START,
  VIDEO_DATA_SAVED,
  UPLOAD_VIDEO_SELECT,
  TRANSCODING_REQUESTED,
  TRANSCODING_PROGRESS,
  TRANSCODING_SUCCESS,
  TRANSCODING_FAILURE
} from 'constants/ActionConstants'
import VideoRecord from 'records/VideoRecords'
import { videoFetchSuccess } from 'actions/VideoActions'
import type { Dispatch } from 'redux'
import type { RootState } from 'types/ApplicationTypes'

import * as Notifications from 'react-notification-system-redux'

export const selectUploaderVideo = createAction(UPLOAD_VIDEO_SELECT)
const uploadRequested = createAction(UPLOAD_REQUESTED)
const uploadProgress = createAction(UPLOAD_PROGRESS)
const uploadRemoteSuccess = createAction(UPLOAD_REMOTE_SUCCESS)
const uploadLocalSuccess = createAction(UPLOAD_LOCAL_SUCCESS)
const videoDataStart = createAction(VIDEO_DATA_START)
const videoDataSaved = createAction(VIDEO_DATA_SAVED)
const transcodingRequested = createAction(TRANSCODING_REQUESTED)
const transcodingProgress = createAction(TRANSCODING_PROGRESS)
const transcodingSuccess = createAction(TRANSCODING_SUCCESS)
const transcodingFailure = createAction(TRANSCODING_FAILURE)

function upsertVideo (videoId, dataToUpdate, state) {
  const v = state.videos.get(videoId)
  const updatedVideo = Object.assign({}, v.toJS(), dataToUpdate)
  delete updatedVideo.fetchStatus
  if (!updatedVideo.filename) {
    updatedVideo.filename = ''
  }
  console.log('SAVING:')
  console.log(updatedVideo)
  return paratii.core.vids.upsert(updatedVideo).catch(error => {
    console.log(error)
    throw error
  })
}

// upload the video to the local ipfs node and dispatch the transcoding process
export const uploadAndTranscode = (file: Object, videoId: string) => (
  dispatch: Dispatch<*>,
  getState: () => RootState
) => {
  console.log('STARTING FILE UPLOAD')

  // create a new Id if none was given
  if (!videoId) {
    videoId = paratii.eth.vids.makeId()
  }
  dispatch(
    videoFetchSuccess(
      new VideoRecord({ id: videoId, owner: paratii.config.account.address })
    )
  )
  dispatch(selectUploaderVideo(videoId))
  dispatch(
    uploadRequested({
      id: videoId,
      filename: file.name,
      filesize: file.size,
      owner: paratii.config.account.address
    })
  )
  // this will upload the file to the local IPFS node and report on progress
  // this wll ALSO start the XHR upload
  const uploader = paratii.ipfs.uploader.add(file)

  uploader.on('error', function (err) {
    console.log('[UPLOAD error]', err)
    throw err
  })
  uploader.on('done', function (files) {
    console.log('[UPLOAD done (local upload)]', files)
    const file = files[0]

    upsertVideo(
      videoId,
      {
        owner: paratii.config.account.address,
        ipfsHashOrig: file.hash,
        filename: file.path,
        filesize: file.size
      },
      getState()
    )
  })

  uploader.on('progress', percent => {
    console.log('upload progress', percent)
    dispatch(uploadProgress({ id: videoId, progress: percent }))
  })

  uploader.on('fileReady', function (file) {
    dispatch(
      uploadLocalSuccess({ id: videoId, hash: file.hash, size: file.size })
    )
    // now we can start the transcoding
    transcodeVideo({
      id: videoId,
      hash: file.hash,
      size: file.size
    })(dispatch, getState)
  })
}

export const transcodeVideo = (videoInfo: Object) => async (
  dispatch: Dispatch<*>,
  getState: () => RootState
) => {
  console.log(
    `Requesting to transcode video ${videoInfo.id} with hash ${videoInfo.hash}`
  )
  dispatch(transcodingRequested(videoInfo))
  // FIXME: paratii-lib should hande the starting of the ipfs node if it is not started yet
  paratii.ipfs.getIPFSInstance().then(function () {
    const transcoder = paratii.ipfs.uploader.transcode(videoInfo.hash, {
      author: paratii.config.account.address,
      size: videoInfo.size
    })

    transcoder.on('uploader:progress', function (hash, size, percent) {
      console.log('upload progress', percent)
      dispatch(uploadProgress({ id: videoInfo.id, progress: percent }))
    })

    transcoder.on('transcoding:error', function (err) {
      console.log('TRANSCODER ERROR', err)
      dispatch(transcodingFailure(videoInfo, err))
    })

    transcoder.on('transcoding:started', function (hash, author) {
      console.log('TRANSCODER STARTED', hash, author)
    })

    transcoder.once('transcoding:progress', function (hash, size, percent) {
      // Once we have this, the file is fully uploaded to the transcoder
      console.log('Remote upload done!')
      dispatch(uploadProgress({ id: videoInfo.id, progress: 100 }))
      dispatch(uploadRemoteSuccess({ id: videoInfo.id, hash: videoInfo.hash }))
      // save the updaded state
      upsertVideo(videoInfo.id, {}, getState())
    })

    transcoder.on('transcoding:progress', function (hash, size, percent) {
      console.log('TRANSCODER PROGRESS', percent)
      percent = parseFloat(percent)
      dispatch(transcodingProgress({ id: videoInfo.id, progress: percent }))
    })

    transcoder.on('transcoding:downsample:ready', function (hash, size) {
      console.log('TRANSCODER DOWNSAMPLE READY', hash, size)
    })

    transcoder.once('transcoding:done', function (hash, result) {
      // if transcoding is done, apparently we have uploaded the file first
      dispatch(uploadRemoteSuccess({ id: videoInfo.id, hash: videoInfo.hash }))
      dispatch(
        transcodingSuccess({
          id: videoInfo.id,
          hash: hash,
          result: result,
          duration: result.duration
        })
      )
      console.log('TRANSCODER DONE', hash, result, videoInfo.id)
      upsertVideo(
        videoInfo.id,
        {
          ipfsHash: result.master.hash,
          owner: paratii.config.account.address,
          duration: result.duration
        },
        getState()
      )
    })
  })
}

export const saveVideoInfo = (videoInfo: Object) => async (
  dispatch: Dispatch<*>,
  getState: () => RootState
) => {
  // the owner is the user that is logged in
  console.log('SAVING VIDEO DATA')

  dispatch(Notifications.success({ message: 'Saving..' }))

  let videoId
  videoInfo.owner = paratii.config.account.address
  if (videoInfo.id) {
    videoId = videoInfo.id
  } else {
    videoId = paratii.eth.vids.makeId()
    videoInfo.id = videoId
    dispatch(videoFetchSuccess(new VideoRecord(videoInfo)))
  }
  dispatch(videoDataStart(videoInfo))
  upsertVideo(videoId, videoInfo, getState())
    .then(videoInfo => {
      // console.log('SAVED')
      dispatch(videoDataSaved(videoInfo))
      dispatch(Notifications.success({ message: 'Video Saved!!' }))
    })
    .catch(error => {
      // console.log(error)
      throw error
    })
}
