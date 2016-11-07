/*
  This file contains the MeetupDialog component! This all starts at the "Let's Meetup!" button found on the Users page. This renders the button, the dialog that pops over the screen, and fills it with the MeetupCreation component. It also contains a lot of the functionality that will be passed to MeetupCreation such as the validate function.
*/

"use strict";

import React from 'react';
//Required for Material-UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MyTheme from '../theme/theme.js';
//Material-UI components used within this form
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import MeetupCreation from './meetupCreation.jsx';
import Snackbar from 'material-ui/Snackbar';
import * as Colors from 'material-ui/styles/colors';
//Services
import eventServices from '../services/eventServices.js';
import chatServices from '../services/chatServices.js';

class MeetupDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      errorText: {},
      creator: this.props.userInfo._id,
      //Target user and creator automatically added to attendees
      attendees: [this.props.userInfo._id, this.props.userId],
      category: 'Dog Park',
      snackbar: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    // this.handleOpenChat = this.handleOpenChat.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validate = this.validate.bind(this);
    this.handleSnackbarClose = this.handleSnackbarClose.bind(this);
  }

  handleOpen() {
    this.setState({open: true});
  }

  // handleOpenChat() {
  //   this.setState({open: true})
  // }

  handleClose() {
    this.setState({open: false});
  }

  handleSnackbarClose() {
    this.setState({snackbar: false});
  }

  validate(values) {
    const errors = {};
    const requiredFields = [ 'eventname', 'where', 'date', 'time' ];
    requiredFields.forEach(field => {
      //Checks if any of the requiredFields don't have a value
      if (!values[field].value) {
        errors[field] = 'Required';
      }
    });
    //Checks if lat and lng are null - means a valid location was not chosen
    if (!this.state.lat || !this.state.lng) {
      errors.where = 'Please enter a valid location';
    }
    if (!this.state.category) {
      errors.category = 'Required';
    }
    return errors;
  }

  handleSubmit() {
    var self = this;
    //Validates the events form
    let errors = this.validate(events);
    let handleClose = this.handleClose;
    //If there's no errors found
    if (Object.keys(errors).length === 0) {
      //Save the event to the db
      eventServices.saveEvent(this.state)
        .then(function (data){
          //Close the form popup
          handleClose();
          //And show the user confirmation that the event was created
          self.setState({snackbar: true });
        });
    }
    this.setState({"errorText": errors});
  }

  handleChange(prop, newValue) {
    var change = {};
    change[prop] = newValue;
    this.setState(change);
  }

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.handleClose}
      />,
      <FlatButton
        label="Create Event"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.handleSubmit}
      />
    ];

    const style3 = {
      height: '1000px',
      width: '100%'
    };



    //autoScrollBodyContent within Dialog is super important when you're wondering why all of your form fields are not showing up
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(MyTheme)}>
        <div>
          <RaisedButton
            onTouchTap={this.handleOpen}
            label="Let's Meetup!"
            primary={true}
          /><br/>

          <Dialog
            title="Meetup Creation"
            titleStyle={{textAlign: 'center'}}
            style={style3}
            actions={actions}
            modal={true}
            open={this.state.open}
            onRequestClose={this.handleClose}
            autoScrollBodyContent={true}
            autoDetectWindowHeight={true}
          >
            <div className="middle">
              <form name="events">
                <MeetupCreation
                  lat={this.props.lat}
                  lng={this.props.lng}
                  targetUser={this.props.userId}
                  change={this.handleChange}
                  userInfo={this.props.userInfo}
                  resetUserInfo={this.props.resetUserInfo}
                  errorText={this.state.errorText}
                />
              </form>
            </div>
          </Dialog>
          <Snackbar
            bodyStyle={{background: Colors.blueGrey600}}
            open={this.state.snackbar}
            message="Event created successfully"
            autoHideDuration={3000}
            onRequestClose={this.handleSnackbarClose}
          />

        </div>

      </MuiThemeProvider>
    )
  }
}

module.exports = MeetupDialog;