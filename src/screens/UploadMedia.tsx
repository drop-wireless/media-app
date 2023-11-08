import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {styles} from './styles/styles';
import Video from 'react-native-video';
import {useState} from 'react';
import sizes from '../constants/sizes';
import videoEncoding from '../constants/videoEncoding'
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import {ScrollView} from 'react-native-gesture-handler';
import RNFS from 'react-native-fs';

import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import LoaderWithProgress from '../components/LoaderWithProgress';
import { useIsFocused } from '@react-navigation/native';

export default function UploadMedia({navigation, route}: any) {
  const {gateway, startTimeInMilliseconds, duration} = route.params;
  const startTime = new Date(startTimeInMilliseconds);

  const [mediaFile, setMediaFile] = useState<any>(null);
  const [continuePressed, setContinuePressed] = useState(false);

  // set true when selecting new media
  const [loadingMedia, setLoadingMedia] = useState(false);

  // key state to fix not updating video issue
  const [mediaKey, setMediaKey] = useState(0);

  const isFocused = useIsFocused(); // need to stop Video element on blur, otherwise crashes on Android

  // const [rotateAngle, setRotateAngle] = useState(0);
  // const [ffprobing, setFfprobing] = useState(false);

  const [ffmpegProgressPercentage, setFFmpegProgressPercentage] = useState(-1);

  function handleSampleMediaPress(i: number) {
    setMediaFile(sampleMedia[i]);
    setMediaKey(mediaKey + 1);
  }
  function cancelEncoding() {
    FFmpegKit.cancel();
  }

  function handleUploadPress() {
    setLoadingMedia(true);
    const durationLimit = 300; // 5 mins
    const options: any = {
      mediaType: 'mixed',
      quality: 1,
      durationLimit: durationLimit,
    };

    launchImageLibrary(options, (res): any => {
      // TODO: HANDLE SELECTED VIDEO > 5 mins
      console.log('launchImageLibrary res:', res);
      if (res.assets) {
        if (res.assets[0].duration && res.assets[0].duration > durationLimit) {
          Toast.show({
            type: 'error',
            text1: 'Maximum video duration is 5 minutes',
            text2: 'Please select a shorter video',
          });
        } else if (
          res.assets[0].duration &&
          res.assets[0].duration > duration * 60
        ) {
          Toast.show({
            type: 'error',
            text1: 'Video duration cannot be longer than reservation duration',
          });
        } else {
          // filtered in FFmpeg, and resolution info should be in file info
          setMediaFile({
            name: res.assets[0].fileName,
            type: res.assets[0].type ? res.assets[0].type : 'video/mp4',
            uri: res.assets[0].uri,
            duration: res.assets[0].duration,
            // witdth: res.assets[0].width,
            // height: res.assets[0].height,
          });
          setMediaKey(mediaKey + 1);
          setLoadingMedia(false);
        }
      }
      else {  // canceled or failed to select
        setMediaKey(0);
        setLoadingMedia(false);
      }
    });
  }

  async function handleContinuePress() {
    setContinuePressed(true);
    if (mediaFile) {
      if (mediaFile.type.startsWith("video")) {
        // const downScaleOption = mediaFile.width && mediaFile.height && Math.min(mediaFile.width, mediaFile.height) > videoEncoding.maxResolution;
        
        // let's alway encode local videos
        if (mediaFile.uri.startsWith("file://")) {
          const totalDurationInSeconds = mediaFile.duration ? mediaFile.duration + 0.9 : undefined;  // to compensate low precision
          const extensionMatch = /(?:\.([^.]+))?$/
          const extension = mediaFile.name.match(extensionMatch)[0];
          const outFileName = "encoded" + extension;
          const outUri = RNFS.CachesDirectoryPath + "/" + outFileName;

          // check if audio channel exists
          const channelProbeSession = await FFprobeKit.execute(`-loglevel error -show_entries stream=codec_type -of default=nw=1 '${decodeURI(mediaFile.uri)}'`);
          const channelProbeLog = await channelProbeSession.getLogsAsString();
          // console.log("stream channels:", channelProbeLog);
          
          //ffmpeg -i ./sample.mp4 -f lavfi -i anullsrc=cl=mono -shortest -vf "scale=-2:min'(1080,ih)'" -c:v libx264 -preset veryfast -crf 18 -c:a aac -y nullAudioWithAudio.mp4
          const nullAudioOption = channelProbeLog.indexOf("audio") < 0 ? videoEncoding.lavfiNullAudio : "";
          const ffmpegCommand = `-i '${decodeURI(mediaFile.uri)}' ${nullAudioOption} -vf "scale=-2:min'(${videoEncoding.maxResolution},ih)'" -c:v ${videoEncoding.videoCodec} -preset ${videoEncoding.compressionSpeed} -crf ${videoEncoding.crf} -c:a ${videoEncoding.audioCodec} -y ${outUri}`

          console.log("start encoding video with ffmpeg command", ffmpegCommand);

          setFFmpegProgressPercentage(0);
          FFmpegKit.executeAsync(ffmpegCommand,
            async completedSession => {
              setFFmpegProgressPercentage(100);
              const returnCode = await completedSession.getReturnCode();
              if (ReturnCode.isSuccess(returnCode)) {
                const fileInfo = await RNFS.stat(outUri);
                console.log("ffmpeg encoded file size:", fileInfo.size, "bytes");
                mediaFile.name = outFileName;
                mediaFile.uri = outUri;
                mediaFile.encoded = true;
                console.log("ffmpeg: succeessfully done. sid:", completedSession.getSessionId());
                setTimeout(() => {  // hook execution sync issue
                  navigateToCheckout();
                }, 1000);
              } else if (ReturnCode.isCancel(returnCode)) {
                // canceled
                console.log("ffmpeg: canceled. sid:", completedSession.getSessionId());
                setFFmpegProgressPercentage(-1);
                setContinuePressed(false); 
              } 
              else {
                Toast.show({ type: "error", text1: "Failed on encoding selected video"})
                console.log("Exit ffmpeg with non success code:", returnCode, await completedSession.getOutput(), "sid:", completedSession.getSessionId());
                setFFmpegProgressPercentage(-1);
                setContinuePressed(false); 
              }
            },
            log => {
              // console.log("ffmpeg log:", log.getMessage());
            },
            statistics => {
              // console.log("ffmpeg stat size:", statistics.getSize());
              if (totalDurationInSeconds) {
                const currentInMilliSeconds = statistics.getTime();
                const progressPercentage = Math.min(Math.round(currentInMilliSeconds / (10*totalDurationInSeconds)), 100);
                console.log("ffmpeg progress:", progressPercentage);
                setFFmpegProgressPercentage(progressPercentage);
              }
              else {
                // no progress info available
                // setFFmpegProgress(0);
              }
            }
          );
        }
        else {  // online, or sample video
          navigateToCheckout();
        }
      }
      else {  // image
        navigateToCheckout();
      }
    }
    else {
      console.log("Warning: no media file selected");
    }
  }

  function navigateToCheckout() {
    console.log("mediaFile before navigation:", mediaFile);
    setFFmpegProgressPercentage(-1);
    setContinuePressed(false);  // need to release locks for coming back
    setMediaKey(0);
    navigation.navigate('Checkout', {
      gateway: gateway,
      // startTime: startTime, // converted to serializable data
      startTimeInMilliseconds: startTime.getTime(),
      duration: duration,
      mediaFile: mediaFile,
      // gasFee: gasFee,
    });
  }

  return (
    <SafeAreaView style={localStyles.container}>
      <ScrollView style={{width: '100%', marginBottom: sizes.sz_sm}}>
        <View style={styles.mediaContainer}>
          {!loadingMedia && 
            isFocused &&
            mediaFile &&
            mediaFile.type.startsWith('video') && (
              <Video
                key={mediaKey}
                source={{uri: mediaFile.uri}}
                resizeMode="cover"
                controls={true}
                style={styles.fullSize}
              />
            )}
          {!loadingMedia && mediaFile && mediaFile.type.startsWith('image') && (
            <Image
              source={{uri: mediaFile.uri}}
              resizeMode="cover"
              style={styles.fullSize}
            />
          )}
          {!mediaFile && (
            <Image
              source={require('../assets/images/mediaPlaceholder.jpg')}
              resizeMode="cover"
              style={styles.fullSize}
            />
          )}
        </View>
        <View style={{marginTop: sizes.sz_xl, alignItems: 'center'}}>
          <Text style={{...styles.subtitleText, marginBottom: sizes.sz_lg}}>
            Try Our Sample Media
          </Text>
        {sampleMedia.map((media, i): any => {
          return (
            <TouchableOpacity key={i} onPress={() => handleSampleMediaPress(i)}>
              <Video
                source={media.source}
                resizeMode="contain"
                style={localStyles.sampleMediaImage}
              />
            </TouchableOpacity>
          );
        })}
        </View>
        <View style={{marginTop: sizes.sz_xl, alignItems: 'center'}}>
          <Text style={styles.subtitleText}>Or Choose Your Own</Text>
          <TouchableOpacity onPress={() => handleUploadPress()}>
            <Icon name="cloud-upload" size={150} color="gray" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      {!loadingMedia && mediaFile && ( //  && !ffprobing
        <TouchableOpacity
          style={[styles.bottomDarkButton, { marginTop: 50}]}
          onPress={() => handleContinuePress()}
          disabled={continuePressed}>
          <Text style={styles.darkButtonText}>Continue</Text>
        </TouchableOpacity>
      )}
      <LoaderWithProgress visible={ffmpegProgressPercentage >= 0} message={"Encoding video..."} progress={ffmpegProgressPercentage/100} cancelAction={ffmpegProgressPercentage < 100 ? cancelEncoding : null} />
    </SafeAreaView>
  );
}

const sampleMedia = [
  {
    name: 'flower.mp4',
    type: 'video/mp4',
    uri: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    source: require('../assets/sampleMedia/flower.mp4'),
  },
];

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  sampleMediaImage: {
    height: 100,
    width: 150,
  },
});
