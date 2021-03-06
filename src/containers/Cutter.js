import React, { Component } from 'react';
import { Input, Button } from 'semantic-ui-react';
import { connect } from 'react-redux';

import emojiCutterClient from '../services/emoji-cutter-client';
import FileSelectButton from '../components/FileSelectButton';
import CircleSpace from '../components/CircleSpace';
import { setEmojiString } from '../actions/emojiActions';
import ServerErrorHelper from '../services/ServerErrorHelper';
import StringHelper from '../services/StringHelper';
import ProgressBar from '../components/ProgressBar';

class Cutter extends Component {
    state = {
        selectedFile: undefined,
        largeEmojiFileName: undefined,
        fileUploadPercent: 0,
        emojiName: '',
        downloadReady: false,
        errorMessage: '',
        progressMessage: '',
    }

    fileSelectedHandler = event => {
        this.setState({ selectedFile: event.target.files[0] });
    }

    fileUploadHandler = async () => {
        if (!this.state.selectedFile)
            return;

        this.setState({ downloadReady: false, errorMessage: '' });
        this.props.setEmojiString('');
        try {
            let res = await emojiCutterClient.cutImageToLargeEmoji(this.state.selectedFile, this.state.emojiName, this.updateUploadProgressHandler)
            this.props.setEmojiString(res.data.emojiString);
            this.setState({ largeEmojiFileName: res.data.fileName, downloadReady: true });
        } catch (err) {
            let errorMessage = 'Unkown server error, please try again later';
            
            if (err && err.response && err.response.data && err.response.data.code)
                errorMessage = ServerErrorHelper.getErrorMessage(err.response.data.code);
            else if (err && err.response && err.response.status === 429)
                errorMessage = 'Only 1 request per 30 seconds is allowed';

            this.setState({ errorMessage });
        }
    }

    updateUploadProgressHandler = (progressEvent) => {
        if (!progressEvent)
            return;

        this.setState({ fileUploadPercent: Math.round(progressEvent.loaded / progressEvent.total * 100) });
    }

    fileDownloadHandler = () => {
        if (!this.state.largeEmojiFileName)
            return;

        emojiCutterClient.downloadEmojiInNewWindow(this.state.largeEmojiFileName);
    }

    render() {
        const uploadFileLabel = this.state.selectedFile ? StringHelper.truncate(this.state.selectedFile.name, 20) : 'Select file';
        let progressMessage = !this.state.downloadReady && this.state.fileUploadPercent === 100 && !this.state.errorMessage ? 'Generating Emoji...' : '';

        return (
            <div style={styles.cutterContainer}>
                <h1 style={styles.cutterHeading}>Create HUGE Emoji</h1>
                <p style={styles.errorMessage}>{this.state.errorMessage}</p>
                <div style={styles.cutterBody}>
                    <div style={styles.cutterBodyLeft}>
                        <CircleSpace style={styles.circleStepStyle}>
                            <h1>1</h1>
                        </CircleSpace>
                    </div>
                    <div style={styles.cutterBodyCenter}>
                        <h3>Select a file</h3>
                        <FileSelectButton onFileSelected={this.fileSelectedHandler} buttonLabel={uploadFileLabel} />
                        <h3>Name your emoji</h3>
                        <Input
                            fluid
                            placeholder='my-huge-emoji'
                            width={'auto'}
                            value={this.state.emojiName}
                            onChange={(e) => this.setState({ emojiName: e.target.value })} />
                        <div style={styles.genDownButtonsContainer}>
                            <div>
                                <Button onClick={this.fileUploadHandler} disabled={!this.state.selectedFile || !this.state.emojiName}>Generate</Button>
                            </div>
                            <div>
                                <Button onClick={this.fileDownloadHandler} disabled={!this.state.downloadReady}>Download</Button>
                            </div>
                        </div>
                        {
                            this.state.fileUploadPercent ?
                                <ProgressBar
                                    style={styles.progressBarContainer}
                                    percent={this.state.fileUploadPercent}
                                    success={this.state.downloadReady}>
                                    <p>{progressMessage}</p>
                                </ProgressBar> : null
                        }
                    </div>
                    <div>
                        {/* right side */}
                    </div>
                </div>
            </div>
        );
    }
}

const styles = {
    cutterContainer: {
        textAlign: 'center',
    },
    cutterHeading: {
        textAlign: 'center'
    },
    errorMessage: {
        color: 'red'
    },
    cutterBody: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
    },
    cutterBodyCenter: {
        textAlign: 'left'
    },
    cutterBodyLeft: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleStepStyle: {
        width: 100,
        height: 100,
        color: 'white',
        backgroundColor: '#9bc1ff'
    },
    genDownButtonsContainer: {
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
    },
    progressBarContainer: {
        paddingTop: '20px',
        textAlign: 'center'
    },
}

const mapStateToProps = state => ({
    // message: state.message.message
});

export default connect(mapStateToProps, { setEmojiString })(Cutter);
