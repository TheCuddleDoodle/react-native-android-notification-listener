import React, { useState, useEffect } from 'react'
import {
    SafeAreaView,
    Text,
    Image,
    Button,
    AppState,
    View,
    FlatList,
    PermissionsAndroid,
    ScrollView,
} from 'react-native'
import base64 from 'react-native-base64';
import { Buffer } from 'buffer';
import RNFS from 'react-native-fs'
import { BleManager, Device } from 'react-native-ble-plx';
import RNAndroidNotificationListener from 'react-native-android-notification-listener'
import RNPhotoManipulator from 'react-native-photo-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage'

import ImageResizer from 'react-native-image-resizer';
import styles from './styles'
import { MimeType } from 'react-native-photo-manipulator/lib/PhotoManipulatorTypes';


let interval: any = null

const BLTManager = new BleManager();

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';

const MESSAGE_UUID = '6d68efe5-04b6-4a85-abc4-c2670b7bf7fd';
const BOX_UUID = 'f27b53ad-c63d-49a0-8c0f-9f297e6cc520';
const MAPTEXT_UUID = 'da66bf2e-05b8-4579-8672-7594312cda24';

function StringToBool(input: String) {
    if (input == '1') {
        return true;
    } else {
        return false;
    }
}

function BoolToString(input: boolean) {
    if (input == true) {
        return '1';
    } else {
        return '0';
    }
}

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
    const [connectedDevice, setConnectedDevice] = useState<Device>();

    const [message, setMessage] = useState('Nothing Yet');
    const [boxvalue, setBoxValue] = useState(false);

    let [jpegRenderedPath, setJpegRenderedPath] = useState("")
    let [savedPngpath, setsavedPngpath] = useState("")
    let [backgroundGreen, setBackgroundGreen] = useState("")
    let [maingreenRendered, setmaingreenRendered] = useState(false)
    let [byteDataOfPng, setByteDataPng] = useState()
    let [bufferSize, setBufferSize] = useState("")

    const extension = 'file://'
    const greenpath = `${extension}${RNFS.CachesDirectoryPath}/image.jpg`;

    let maingreen = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAA8ADwDAREAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAQIDAAQI/8QAKhAAAQIEAwgDAQEAAAAAAAAAAQARAiExQVFx8BJhgZGhscHRMuHxAyL/xAAaAQEBAQEBAQEAAAAAAAAAAAACAAMBBAcK/8QAKxEAAQIFAgUEAwEBAAAAAAAAAQARAiExQfBRYXGBkaGxEsHR4QMy8RNS/9oADAMBAAIRAxEAPwDylAAXcPTz6Xyn1RatPTzK3D2X59iAa579EIjEIgwYA5MMRnfll0EGWrPdzdyaMKNxd69VQSQH1+y7WRMMIJYuTJmnW+TkrM6orilIwnaLYu+Gtz81qIgwfRm1zduifqIakgOYtwknP+YZWDDsgJxCzl5dUDOes0IYncH98fWRK7GGL69s88QFZzTMDYFESvEOA+wuEC4HMIAbIm1ZTYUGNzxVEPXR5i1anS1BNiQuosCx4jXpcDgM50Ns5v1Vl828apRCRE7ynmXxtqiTsJ+qzPQNofHugISIiXlPvj5J1qCDRNbx0XmIierDBQjzQuqeaYOyBDgjHjrPinCWL/Ghv7XVr23wfCQQG5Hf0mfyDQzlpPupIQxZ3TBcOiYgC01YgRBis4AXezT+ON5UvolmZxWAYNguRVL1z2bJqRUYiQxOk263seuussqEkGXTXNvlSnFGxIA55YWSEPqmSb2Y1zAhFG0gKXyd9fASwf12ixDfvtpWq+EYGmDTxQ0FpvV9NaGNy1O39ejYLLOODW1CMOBNRj+R6rWD9eJQMAJkW2ZB4sTzK0LWzM1TV4SDCXqRJrG41brkdCwYl3qQaEeL0Dyp30mewfkxPslntbmv43u7v6RIHp3e2u50ajXBZ5riZP8AGYWa99eUw/8AVKMcziLHdmN7p67olqlid6sTSWmvcTQhhm4DPUgYHu9xPNGIgaE6a8QPdZAE0GcfgvVWdq87a0LrKZ3PU5mi1hdp1zv9XdB4TXZ5hdaIU9XQpLRQvn4w0CugxQ1dm4t/KEOPClLa2HBkTKevrNwmQImrye+vRiK8GKf+gAAIGlWoqCMNOR5649UIoDNqF9iMsyCEUQIYG+uqoIDDUM1HrO8tvZSEMDsXlrXPizEzyp75k2Bgcu8pZntNtuHfnaU9dZLMQnaRnQmd+m/CaaB/3S1Xvh5Tb0VuwpTjfOClOiaBjYsz81YEkOQzlvvI0zzllFMyLsHNNgaCsnO2jJRFg9cudMuoxwiKKcy9r7vq1HThoDQNy4/cnqRpiS5Bq9q3p8DQquzCGeZvM3lJrP3rJchiJNJGncz3ZegQk2+N36/WixACle33hluTJczm6vS3JsEgbgEWkng+I1dZRRFyHl42zy65mYywghJpXEsOHq8gMFQxMepMplhnclTac9vrOOjGwGDWo/Wk5cd6TiPXUvWjSrrajboxFhKpO+uML8FJiZsS92TBNieRREJMyZmrwgnuqCKGglgM8navDBYkEzJdqnRq1b7Wla5ndMwM72IZ+BK7CQxEWu+O+SUAHBLcWt5USS98MM/Od1pLbKLWGKH9QOGlX+5qzAzYcR3WLm5PI/1ZkkSJO4dFcr5XFvrUtBda/FrdH062UoxuTIgh651njppph2k4Jq9ZULf86/AU70O1XVYQwA1iugCJyReUzQMFLnAa5q/5gkJvu4PIkeFK8HxHHuVlH+x5eApLsh49w7h9dUvUWg3PgtnZGANGa1h7zTigyCBqeJW35Lc/ZJF8xvbvZaQfrz68V54v3G7ebJovidXSYdMzRMhw2qX+d+HlD8lufsuQgQkgOQwrzHt8qi7BTgfv3SX/2Q=="

    if (maingreenRendered == false) {
        RNFS.writeFile(greenpath, maingreen.split(",")[1], 'base64')
            .then((success) => {
                setBackgroundGreen(greenpath)
                console.log("greenpath", greenpath)
                // You can now use the cacheFilePath to load the image or perform other operations
            })
            .catch(error => {
                console.log('Error saving image to cache:', error);
            });
        setmaingreenRendered(true)
    }

    useEffect(() => {
        if (iconLarge) {
            console.log(iconLarge.split(",")[1])
            const extension = 'file://'
            const path = `${extension}${RNFS.CachesDirectoryPath}/image.png`;

            // const path =`${extension}${RNFS.CachesDirectoryPath}/image.png`;
            RNFS.exists(path).then(exists => {
                if (exists) console.log("exists")
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
    }, [iconLarge])


    useEffect(() => {
        if (savedPngpath.length > 0) {
            console.log("savedpath", savedPngpath)   
            const position = { x: 0, y: 0 };
            const mimeType: MimeType = MimeType.JPEG
            RNPhotoManipulator.overlayImage(backgroundGreen, savedPngpath, position, mimeType).then(path => {
                console.log(`Result image path: ${path}`);
                RNPhotoManipulator.optimize(path, 90).then(finalPath => {
                    console.log(`Result image path: ${finalPath}`);
                    setJpegRenderedPath(finalPath)
                });
                


            }).catch(err => {
                console.error('manipulator failed with ', err);
            });
        }

    }, [savedPngpath])
    //Is a device connected?
    const [isConnected, setIsConnected] = useState(false);

    //What device is connected?


    async function sendBoxValue() {
        RNFS.readFile(jpegRenderedPath, 'base64')
            .then(base64Data => {
             
                    let buffer = "517F4N55F6N53F8N52F9N51F10N50F11N50F11N49F12N50F11N49F12N50F11N49F12N21F40N19F42N15F46N13F48N11F48N12F47N12F47N13F46N13F9N26F11N14F9N26F10N14F8N26F11N15F8N26F10N16F8N24F11N17F8N24F10N18F8N23F10N19F8N23F9N20F8N23F8N21F8N24F6N22F8N25F4N23F8N26F2N24F8N52F8N52F8N52F8N52F8N52F8N52F8N52F8N52F8N52F8N52F8N52F8N52F8N468F"
                    let encodedValue = base64.encode(buffer);
                    
                    BLTManager.writeCharacteristicWithResponseForDevice(
                        connectedDevice?.id ? connectedDevice?.id : "",
                        SERVICE_UUID,
                        BOX_UUID,
                        encodedValue,
                    ).then(characteristic => {
                        console.log('Boxvalue changed to :', base64.decode(characteristic.value));
                        
                    })
                    .catch(error => {
                        console.log('Error reading file:', error);
                      });
                 })
             
                
    }
    // Scans availbale BLT Devices and then call connectDevice
    async function scanDevices() {

        PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Permission Localisation Bluetooth',
                message: 'Requirement for Bluetooth',
                buttonNeutral: 'Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        ).then(answer => {
            console.log('scanning');
            // display the Activityindicator

            BLTManager.startDeviceScan(null, null, (error, scannedDevice) => {
                if (error) {
                    console.warn(error);
                }
                console.log(scannedDevice)
                if (scannedDevice && scannedDevice.name == 'NotificationServer') {
                    BLTManager.stopDeviceScan();
                    //connectDevice
                    connectDevice(scannedDevice)
                }
            });

            // stop scanning devices after 5 seconds
            setTimeout(() => {
                BLTManager.stopDeviceScan();
            }, 5000);
        });
    }
    async function connectDevice(device: Device) {
        device
            .connect()
            .then(device => {
                device.requestMTU(500)
                .then((device)=>{
                    console.log("MTU set to 500")
                })
                .catch(error =>{
                    console.log("unable to set MTU:", error)
                })
                setConnectedDevice(device)
                setIsConnected(true)
                return device.discoverAllServicesAndCharacteristics()
            })
            .then(device => {
                BLTManager.onDeviceDisconnected(device.id, (error, device) => {
                    console.log('Device DC');
                    setIsConnected(false)


                })
                device
                    .readCharacteristicForService(SERVICE_UUID, MESSAGE_UUID)
                    .then(valenc => {
                        console.log(base64.decode(valenc?.value))
                        setMessage(base64.decode(valenc?.value));
                    });
                //BoxValue
                device
                    .readCharacteristicForService(SERVICE_UUID, BOX_UUID)
                    .then(valenc => {
                        setBoxValue(StringToBool(base64.decode(valenc?.value)));
                    });

                //monitor values and tell what to do when receiving an update

                //Message
                device.monitorCharacteristicForService(
                    SERVICE_UUID,
                    MESSAGE_UUID,
                    (error, characteristic) => {
                        if (characteristic?.value != null) {
                            setMessage(base64.decode(characteristic?.value));
                            console.log(
                                'Message update received: ',
                                base64.decode(characteristic?.value),
                            );
                        }
                    },
                    'messagetransaction',
                );

                //BoxValue
                device.monitorCharacteristicForService(
                    SERVICE_UUID,
                    BOX_UUID,
                    (error, characteristic) => {
                        if (characteristic?.value != null) {
                            setBoxValue(StringToBool(base64.decode(characteristic?.value)));
                            console.log(
                                'Box Value update received: ',
                                base64.decode(characteristic?.value),
                            );
                        }
                    },
                    'boxtransaction',
                );

                console.log('Connection established');

            }
            )
    }

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
                    {!!jpegRenderedPath && (
                        <View style={styles.notificationImageWrapper}>
                            <Image
                                source={{ uri: jpegRenderedPath }}
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
            <View>
                <View style={styles.buttonWrapper}>
                    <Text
                        style={[
                            styles.permissionStatus,

                        ]}>
                        {'Scan devices'}
                    </Text>
                    <Button
                        title='Open Configuration'
                        onPress={scanDevices}
                    />
                </View>
                <View style={styles.buttonWrapper}>
                    <Text
                        style={[
                            styles.permissionStatus,

                        ]}>
                        {'box charactericstsic'}
                    </Text>
                    <Button
                        title='Send Beacon'
                        onPress={sendBoxValue}
                    />
                </View>
                <Text
                    style={[
                        styles.permissionStatus,

                    ]}>
                    {message}
                </Text>
            </View>
        </View>


    )
}

function App() {
    const [lastNotification, setLastNotification] = useState<any>(null)
    const [hasPermission, setHasPermission] = useState(false)

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
