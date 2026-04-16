import { ChartFrameEnum, ConfigType, PackagesCategoryEnum } from '@/packages/index.d'
import { ImageConfig } from '@/packages/components/Informations/Mores/Image/index'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../index.d'
import { setLocalStorage, getLocalStorage, goDialog } from '@/utils'
import { StorageEnum } from '@/enums/storageEnum'
import { FileTypeEnum } from '@/enums/fileTypeEnum'
import { backgroundImageSize } from '@/settings/designSetting'
import { usePackagesStore } from '@/store/modules/packagesStore/packagesStore'
import { uploadFile } from '@/api/path'
import { ResultEnum } from '@/enums/httpEnum'
import { useSystemStore } from '@/store/modules/systemStore/systemStore'

const StoreKey = StorageEnum.GO_USER_MEDIA_PHOTOS

/**
 * 上传完成事件类型
 */
type UploadCompletedEventType = {
  fileName: string
  url: string
}

const userPhotosList: ConfigType[] = getLocalStorage(StoreKey) || []

const uploadFileToServer = async (file: File, callback: Function | null = null) => {
  const { name, size, type } = file
  if (size > 1024 * 1024 * backgroundImageSize) {
    window['$message'].warning(`图片超出 ${backgroundImageSize}M 限制，请重新上传！`)
    return false
  }
  if (type !== FileTypeEnum.PNG && type !== FileTypeEnum.JPEG && type !== FileTypeEnum.GIF) {
    window['$message'].warning('文件格式不符合，请重新上传！')
    return false
  }

  try {
    // 创建 FormData 对象用于上传
    const formData = new FormData()
    formData.append('object', file)

    // 调用上传接口
    const uploadRes = await uploadFile(formData)

    if (uploadRes && uploadRes.code === ResultEnum.SUCCESS) {
      let imageUrl = ''
      if (uploadRes.data.fileurl) {
        imageUrl = `${uploadRes.data.fileurl}?time=${new Date().getTime()}`
      } else {
        const systemStore = useSystemStore()
        imageUrl = `${systemStore.getFetchInfo.OSSUrl || ''}${uploadRes.data.fileName}?time=${new Date().getTime()}`
      }

      const eventObj: UploadCompletedEventType = { fileName: name, url: imageUrl }
      callback && callback(eventObj)
    } else {
      window['$message'].error('图片上传失败，请稍后重试！')
    }
  } catch (error) {
    console.error('上传文件失败:', error)
    window['$message'].error('图片上传失败，请稍后重试！')
  }
}

const addConfig = {
  ...ImageConfig,
  category: ChatCategoryEnum.PRIVATE,
  categoryName: ChatCategoryEnumName.PRIVATE,
  package: PackagesCategoryEnum.PHOTOS,
  chartFrame: ChartFrameEnum.STATIC,
  title: '点击上传图片',
  image: 'upload.png',
  redirectComponent: `${ImageConfig.package}/${ImageConfig.category}/${ImageConfig.key}`, // 跳转组件路径规则：packageName/categoryName/componentKey
  disabled: true,
  configEvents: {
    // 点击上传事件
    addHandle: (photoConfig: ConfigType) => {
      // 创建文件选择元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.png,.jpg,.jpeg,.gif'
      input.onchange = async () => {
        if (!input.files || !input.files.length) return
        const file = input.files[0]

        goDialog({
          message: `图片需小于 ${backgroundImageSize}M，上传后将存储到服务器。`,
          transformOrigin: 'center',
          onPositiveCallback: async () => {
            await uploadFileToServer(file, (e: UploadCompletedEventType) => {
              // 和上传组件一样配置，更换标题，图片，预设数据
              const packagesStore = usePackagesStore()
              const newPhoto = {
                ...ImageConfig,
                category: ChatCategoryEnum.PRIVATE,
                categoryName: ChatCategoryEnumName.PRIVATE,
                package: PackagesCategoryEnum.PHOTOS,
                chartFrame: ChartFrameEnum.STATIC,
                title: e.fileName,
                image: e.url,
                dataset: e.url,
                redirectComponent: `${ImageConfig.package}/${ImageConfig.category}/${ImageConfig.key}` // 跳转组件路径规则：packageName/categoryName/componentKey
              }
              userPhotosList.unshift(newPhoto)
              // 存储在本地数据中
              setLocalStorage(StoreKey, userPhotosList)
              // 插入到上传按钮前的位置
              packagesStore.addPhotos(newPhoto, 1)
            })
          }
        })
      }
      input.click()
    }
  }
}

export default [addConfig, ...userPhotosList]
