import React, { useState, useEffect } from 'react'
import {
    SafeAreaView,
    Text,
    Image,
    Button,
    AppState,
    View,
    FlatList,
    ScrollView,
} from 'react-native'
import { Buffer } from 'buffer';
import RNFS from 'react-native-fs'
import RNAndroidNotificationListener from 'react-native-android-notification-listener'
import RNPhotoManipulator from 'react-native-photo-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage'

import ImageResizer from 'react-native-image-resizer';
import styles from './styles'
import atob from './atob';

let interval: any = null

interface INotificationProps {
    time: string
    app: string
    title: string
    titleBig: string
    text: string
    subText: string
    summaryText: string
    bigText: string
    audioContentsURI: string
    imageBackgroundURI: string
    extraInfoText: string
    icon: string
    image: string
    iconLarge: string
}

const Notification: React.FC<INotificationProps> = ({
    time,
    app,
    title,
    titleBig,
    text,
    subText,
    summaryText,
    bigText,
    audioContentsURI,
    imageBackgroundURI,
    extraInfoText,
    icon,
    image,
    iconLarge,
}) => {
   
    let [jpegRenderedPath, setJpegRenderedPath] = useState("")
    let [savedPngpath, setsavedPngpath] = useState("")
    let [backgroundGreen, setBackgroundGreen] = useState("")
    const extension ='file://' 
    const greenpath =`${extension}${RNFS.CachesDirectoryPath}/image.jpg`;

    let maingreen = "data:image/jpeg;base64,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"
    RNFS.writeFile(greenpath, maingreen.split(",")[1], 'base64')
            .then((success) => {
                setBackgroundGreen(greenpath)
               console.log("greenpath",greenpath)
                // You can now use the cacheFilePath to load the image or perform other operations
            })
            .catch(error => {
                console.log('Error saving image to cache:', error);
            });
    useEffect(()=>{
        if(iconLarge){
            console.log(iconLarge.split(",")[1])
            const extension ='file://' 
            const path =`${extension}${RNFS.CachesDirectoryPath}/image.png`;

            // const path =`${extension}${RNFS.CachesDirectoryPath}/image.png`;
            RNFS.exists(path).then( exists => {
                  if(exists)console.log("exists")
                })
           
            RNFS.writeFile(path, iconLarge.split(",")[1], 'base64')
            .then((success) => {
                setsavedPngpath(path)
               console.log(path)
                // You can now use the cacheFilePath to load the image or perform other operations
            })
            .catch(error => {
                console.log('Error saving image to cache:', error);
            });

        }
    },[iconLarge])


    useEffect(() => {
        if (savedPngpath.length > 0) {
            console.log("savedpath", savedPngpath)
            let backgroundUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/800px-Black_colour.jpg"

            const position = { x: 0, y: 0 };
            RNPhotoManipulator.overlayImage(backgroundGreen, savedPngpath, position).then(path => {
                console.log(`Result image path: ${path}`);
                setJpegRenderedPath(path)


            }).catch(err => {
                console.error('manipulator failed with ', err);
            });
        }

    }, [savedPngpath])

    return (

        <View style={styles.notificationWrapper}>
            <View style={styles.notification}>
                <View style={styles.imagesWrapper}>
                    {!!icon && (
                        <View style={styles.notificationIconWrapper}>
                            <Image
                                source={{ uri: icon }}
                                style={styles.notificationIcon}
                            />
                        </View>
                    )}
                    {!!image && (
                        <View style={styles.notificationImageWrapper}>
                            <Image
                                source={{ uri: image }}
                                style={styles.notificationImage}
                            />
                        </View>
                    )}
                    {!!jpegRenderedPath &&(
                        <View style={styles.notificationImageWrapper}>
                            <Image
                                source={{ uri:jpegRenderedPath }}
                                style={styles.notificationImage}
                            />
                        </View>
                    )}


                </View>
                <View style={styles.notificationInfoWrapper}>
                  

                    <Text style={styles.textInfo}>{`app: ${app}`}</Text>
                    <Text style={styles.textInfo}>{`title: ${title}`}</Text>
                    <Text style={styles.textInfo}>{`text: ${text}`}</Text>
                    {!!time && (
                        <Text style={styles.textInfo}>{`time: ${time}`}</Text>
                    )}
                    {!!titleBig && (
                        <Text
                            style={
                                styles.textInfo
                            }>{`titleBig: ${titleBig}`}</Text>
                    )}
                    {!!subText && (
                        <Text
                            style={
                                styles.textInfo
                            }>{`subText: ${subText}`}</Text>
                    )}
                    {!!summaryText && (
                        <Text
                            style={
                                styles.textInfo
                            }>{`summaryText: ${summaryText}`}</Text>
                    )}
                    {!!bigText && (
                        <Text
                            style={
                                styles.textInfo
                            }>{`bigText: ${bigText}`}</Text>
                    )}
                    {!!audioContentsURI && (
                        <Text
                            style={
                                styles.textInfo
                            }>{`audioContentsURI: ${audioContentsURI}`}</Text>
                    )}
                    {!!imageBackgroundURI && (
                        <Text
                            style={
                                styles.textInfo
                            }>{`imageBackgroundURI: ${imageBackgroundURI}`}</Text>
                    )}
                    {!!extraInfoText && (
                        <Text
                            style={
                                styles.textInfo
                            }>{`extraInfoText: ${extraInfoText}`}</Text>
                    )}
                </View>
            </View>
        </View>
    )
}

function App() {
    const [hasPermission, setHasPermission] = useState(false)
    const [lastNotification, setLastNotification] = useState<any>(null)

    const handleOnPressPermissionButton = async () => {
        /**
         * Open the notification settings so the user
         * so the user can enable it
         */
        RNAndroidNotificationListener.requestPermission()
    }

    const handleAppStateChange = async (
        nextAppState: string,
        force = false
    ) => {
        if (nextAppState === 'active' || force) {
            const status =
                await RNAndroidNotificationListener.getPermissionStatus()
            setHasPermission(status !== 'denied')
        }
    }

    const handleCheckNotificationInterval = async () => {
        const lastStoredNotification = await AsyncStorage.getItem(
            '@lastNotification'
        )

        if (lastStoredNotification) {
            /**
             * As the notification is a JSON string,
             * here I just parse it
             */
            setLastNotification(JSON.parse(lastStoredNotification))
        }
    }

    useEffect(() => {
        clearInterval(interval)

        /**
         * Just setting a interval to check if
         * there is a notification in AsyncStorage
         * so I can show it in the application
         */
        interval = setInterval(handleCheckNotificationInterval, 3000)

        const listener = AppState.addEventListener(
            'change',
            handleAppStateChange
        )

        handleAppStateChange('', true)

        return () => {
            clearInterval(interval)
            listener.remove()
        }
    }, [])

    const hasGroupedMessages =
        lastNotification &&
        lastNotification.groupedMessages &&
        lastNotification.groupedMessages.length > 0

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.buttonWrapper}>
                <Text
                    style={[
                        styles.permissionStatus,
                        { color: hasPermission ? 'green' : 'red' },
                    ]}>
                    {hasPermission
                        ? 'Allowed to handle notifications'
                        : 'NOT allowed to handle notifications'}
                </Text>
                <Button
                    title='Open Configuration'
                    onPress={handleOnPressPermissionButton}
                    disabled={hasPermission}
                />
            </View>
            <View style={styles.notificationsWrapper}>
                {lastNotification && !hasGroupedMessages && (
                    <ScrollView style={styles.scrollView}>
                        <Notification {...lastNotification} />
                    </ScrollView>
                )}
                {lastNotification && hasGroupedMessages && (
                    <FlatList
                        data={lastNotification.groupedMessages}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item }) => (
                            <Notification
                                app={lastNotification.app}
                                {...item}
                            />
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}

export default App
