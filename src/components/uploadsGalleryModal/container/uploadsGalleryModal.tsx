import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, View } from 'react-native';
import { View as AnimatedView } from 'react-native-animatable';
import bugsnapInstance from '../../../config/bugsnag';
import { addImage, deleteImage, getImages, uploadImage } from '../../../providers/ecency/ecency';
import UploadsGalleryContent from '../children/uploadsGalleryContent';
import styles from '../children/uploadsGalleryModalStyles';
import ImagePicker from 'react-native-image-crop-picker';
import { signImage } from '../../../providers/hive/dhive';
import { useAppSelector } from '../../../hooks';
import { generateRndStr } from '../../../utils/editor';


export interface UploadsGalleryModalRef {
    showModal: () => void;
}

export enum MediaInsertStatus {
    UPLOADING = 'UPLOADING',
    READY = 'READY',
    FAILED = 'FAILED'
}

export interface MediaInsertData {
    url: string,
    filename?: string,
    text: string,
    status: MediaInsertStatus
}

interface UploadsGalleryModalProps {
    username: string;
    isEditing: boolean;
    handleMediaInsert: (data: Array<MediaInsertData>) => void;
    setIsUploading: (status: boolean) => void;
}

export const UploadsGalleryModal = forwardRef(({
    username,
    isEditing,
    handleMediaInsert,
    setIsUploading
}: UploadsGalleryModalProps, ref) => {
    const intl = useIntl();

    const pendingInserts = useRef<MediaInsertData[]>([]);

    const [mediaUploads, setMediaUploads] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isAddingToUploads, setIsAddingToUploads] = useState(false);


    const isLoggedIn = useAppSelector(state => state.application.isLoggedIn);
    const pinCode = useAppSelector(state => state.application.pin);
    const currentAccount = useAppSelector(state => state.account.currentAccount);


    useImperativeHandle(ref, () => ({
        toggleModal: () => {
            setShowModal(!showModal);
        },
    }));


    useEffect(() => {
        _getMediaUploads();
    }, []);

    useEffect(()=>{
        if(!isEditing && pendingInserts.current.length){
            handleMediaInsert(pendingInserts.current);
            pendingInserts.current = []
        }
    },[isEditing])


    const _handleOpenImagePicker = (addToUploads?:boolean) => {
        ImagePicker.openPicker({
            includeBase64: true,
            multiple: true,
            mediaType: 'photo',
            smartAlbums: ['UserLibrary', 'Favorites', 'PhotoStream', 'Panoramas', 'Bursts'],
        })
            .then((images) => {
                _handleMediaOnSelected(images, !addToUploads);
             
            })
            .catch((e) => {
                _handleMediaOnSelectFailure(e);
            });
    };


    const _handleOpenCamera = () => {
        ImagePicker.openCamera({
            includeBase64: true,
            mediaType: 'photo',
        })
            .then((image) => {
                _handleMediaOnSelected(image, true);
              
            })
            .catch((e) => {
                _handleMediaOnSelectFailure(e);
            });
    };



    const _handleMediaOnSelected = async (media: any[], shouldInsert:boolean) => {

        // this.setState({
        //     failedImageUploads: 0
        // })
        try {
            if (media.length > 0) {

                if(shouldInsert){
                    media.forEach((element, index) => {
                        media[index].filename = element.filename || generateRndStr();
                        handleMediaInsert([{
                            filename: element.filename,
                            url: '',
                            text: '',
                            status: MediaInsertStatus.UPLOADING
                        }])
                    })
                }

                for (let index = 0; index < media.length; index++) {
                    const element = media[index];
                    await _uploadImage(element, { shouldInsert });
                }
            } else {
                //single image is selected, insert placeholder;
                handleMediaInsert([{
                    filename: media.filename || generateRndStr(),
                    url: '',
                    text: '',
                    status: MediaInsertStatus.UPLOADING
                }])

                await _uploadImage(media, { shouldInsert });
            }

            // if (this.state.failedImageUploads) {
            //     Alert.alert(intl.formatMessage(
            //         { id: 'uploads_modal.failed_count' },
            //         {
            //             totalCount: this.state.failedImageUploads,
            //             failedCount: media.length || 1
            //         })
            //     );
            // }

        } catch (error) {
            console.log("Failed to upload image", error);
            // console.log('failedImageUploads : ', this.state.failedImageUploads);

            bugsnapInstance.notify(error);
        }

    };



    const _uploadImage = async (media, { shouldInsert } = { shouldInsert: false }) => {

        if (!isLoggedIn) return;
        try {
            setIsLoading(true);
            if (setIsUploading) {
                setIsUploading(true)
            }
            if(!shouldInsert){
                setIsAddingToUploads(true);
            }

            let sign = await signImage(media, currentAccount, pinCode);

            let MAX_RETRY = 2;

            let res: any = null;

            for (var i = 0; i < MAX_RETRY; i++) {
                res = await uploadImage(media, currentAccount.name, sign);
                if (res && res.data) {
                    break;
                }
            }

            if (res.data && res.data.url) {

                if (shouldInsert) {
                    _handleMediaInsertion({
                        filename: media.filename,
                        url: res.data.url,
                        text: '',
                        status: MediaInsertStatus.READY
                    })
                } else {
                    _addUploadedImageToGallery(res.data.url)
                }

                setIsLoading(false);



            } else if (res.error) {
                throw res.error
            }

        } catch (error) {
            console.log('error while uploading image : ', error);
            // this.setState({ failedImageUploads: this.state.failedImageUploads + 1 });
            if (error.toString().includes('code 413')) {
                Alert.alert(
                    intl.formatMessage({
                        id: 'alert.fail',
                    }),
                    intl.formatMessage({
                        id: 'alert.payloadTooLarge',
                    }),
                );
            } else if (error.toString().includes('code 429')) {
                Alert.alert(
                    intl.formatMessage({
                        id: 'alert.fail',
                    }),
                    intl.formatMessage({
                        id: 'alert.quotaExceeded',
                    }),
                );
            } else if (error.toString().includes('code 400')) {
                Alert.alert(
                    intl.formatMessage({
                        id: 'alert.fail',
                    }),
                    intl.formatMessage({
                        id: 'alert.invalidImage',
                    }),
                );
            } else {
                Alert.alert(
                    intl.formatMessage({
                        id: 'alert.fail',
                    }),
                    error.message || error.toString(),
                );
            }

            if (shouldInsert) {
                _handleMediaInsertion({
                    filename: media.filename,
                    url: '',
                    text: '',
                    status: MediaInsertStatus.FAILED
                })
            }

            setIsLoading(false);
            if (setIsUploading) {
                setIsUploading(false)
            }
            setIsAddingToUploads(false);
        }

    };


    const _handleMediaOnSelectFailure = (error) => {

        if (error.code === 'E_PERMISSION_MISSING') {
            Alert.alert(
                intl.formatMessage({
                    id: 'alert.permission_denied',
                }),
                intl.formatMessage({
                    id: 'alert.permission_text',
                }),
            );
        } else {
            Alert.alert(
                intl.formatMessage({
                    id: 'alert.fail',
                }),
                error.message || JSON.stringify(error),
            );
        }
    };


    const _handleMediaInsertion = (data:MediaInsertData) => {
        if(isEditing){
            pendingInserts.current.push(data);
        }else if(handleMediaInsert) {
            handleMediaInsert([data]);
        }
    }


    //save image to user gallery
    const _addUploadedImageToGallery = async (url: string) => {
        try {
            console.log("adding image to gallery", username, url)
            setIsLoading(true);
            await addImage(url);
            await _getMediaUploads();
            setIsLoading(false);
        } catch (err) {
            console.warn("Failed to add image to gallery, could possibly a duplicate image", err)
            setIsLoading(false);
            setIsAddingToUploads(false);
        }

    }


    // remove image data from user's gallery
    const _deleteMedia = async (indices) => {
        try {
            setIsLoading(true);
            for (const index of indices.keys()) {
                await deleteImage(mediaUploads[index]._id)
            }
            await _getMediaUploads();

            setIsLoading(false);
            return true
        } catch (err) {
            console.warn("failed to remove image from gallery", err)
            setIsLoading(false);
            return false
        }
    }


    //fetch images from server
    const _getMediaUploads = async () => {
        try {
            if (username) {
                setIsLoading(true);
                console.log("getting images for: " + username)
                const images = await getImages()
                console.log("images received", images)
                setMediaUploads(images);
                setIsLoading(false);
            }
        } catch (err) {
            console.warn("Failed to get images")
            setIsLoading(false);
        }
        setIsAddingToUploads(false);
    }

    //inserts media items in post body
    const _insertMedia = async (map: Map<number, boolean>) => {

        const data: MediaInsertData[] = []
        for (const index of map.keys()) {
            console.log(index)
            const item = mediaUploads[index]
            data.push({
                url: item.url,
                text: "",
                status: MediaInsertStatus.READY
            })

        }
        handleMediaInsert(data)
    }

    const _renderContent = () => {
        return (
            <UploadsGalleryContent
                mediaUploads={mediaUploads}
                isLoading={isLoading}
                isAddingToUploads={isAddingToUploads}
                getMediaUploads={_getMediaUploads}
                deleteMedia={_deleteMedia}
                insertMedia={_insertMedia}
                handleOpenCamera={_handleOpenCamera}
                handleOpenGallery={_handleOpenImagePicker}

            />
        )
    }


    return (
        showModal &&
        <AnimatedView animation='slideInRight' duration={500}>
            <View style={styles.modalStyle}>
                {_renderContent()}
            </View>
        </AnimatedView>

    );
});


