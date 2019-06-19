import React from "react";
import { Link } from "react-router-dom";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Icon from "@material-ui/core/Icon";
import TextField from '@material-ui/core/TextField';
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import ListItemText from "@material-ui/core/ListItemText";
import Select from "@material-ui/core/Select";
import Checkbox from "@material-ui/core/Checkbox";
import Chip from "@material-ui/core/Chip";
import FormHelperText from '@material-ui/core/FormHelperText';
import NativeSelect from '@material-ui/core/NativeSelect';


// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import { CircularProgress } from "@material-ui/core";

const styles = {
  cardCategoryWhite: {
    color: "rgba(255,255,255,.62)",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0"
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none"
  }
};

class TrainJobs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      "app": "fashion_mnist_app",
      "task": "IMAGE_CLASSIFICATION",
      "train_dataset": "",
      "val_dataset": "",
      "availableDatasets": [],
      "budget": { "MODEL_TRIAL_COUNT": 2 },
      "models": [],
      "availableModels": [],
      "submit_status": "none" // "none", "submitting", "success", "failed"
    }
    this.handleClickButton = this.handleClickButton.bind(this)
  }

  async componentDidMount() {
    const { appUtils: { rafikiClient, showError } } = this.props;
    try {
      const availableModels = await rafikiClient.getAvailableModels()
      const availableDatasets = await rafikiClient.getDatasets({"task": this.state.task})
      this.setState({availableModels, availableDatasets})
    } catch(error) {
      showError(error, 'Failed to load available models and datasets');
    }
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    })
  }



  async handleClickButton(event) {
    event.preventDefault();
    const { appUtils: { rafikiClient, showError } } = this.props;

    try {
      console.log("button clicked")
      this.setState({ "submit_status": "submitting" })
      const json_params = {
        "app": this.state.app,
        "task": this.state.task,
        "train_dataset_id": this.state.train_dataset.id,
        "val_dataset_id": this.state.val_dataset.id,
        "budget": this.state.budget,
        "model_ids": this.state.models.map(model=>model.id)
      }
      debugger;
      await rafikiClient.createTrainJob(json_params)
      alert("Create Train Job succeed")
      this.setState({ "submit_status": "succeed" })
    } catch (error) {
      this.setState({ "submit_status": "failed" })
      showError(error, 'Failed createJobs');
    }
  }


  // Utils: use to check if obj is in Array
  containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }

    return false;
  }

  render() {

    let SubmitButton = null

    switch (this.state.submit_status) {
      case "submitting":
        SubmitButton = <CircularProgress />
        break;
      case "succeed":
        SubmitButton = (<Link to="/admin/jobs">
          <Button color="primary">Back</Button>
        </Link>)
        break;
      default:
        SubmitButton = (
          <Button onClick={this.handleClickButton} color="primary">Create Jobs</Button>
        )
        break;
    }

    const { classes } = this.props;
    const availableDatasets = this.state.availableDatasets;

    return (
      <div>
        <GridContainer justify="center" alignContent="center">
          <GridItem xs={12} sm={12} md={12} lg={12} xl={12}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}><Icon>add_photo_alternate</Icon>New Train Jobs</h4>
                <p className={classes.cardCategoryWhite}>Image Classification</p>
              </CardHeader>
              <CardBody>
                <GridContainer justify="center" alignContent="center">
                  <GridItem xs={12} sm={12} md={12} lg={8} xl={6}>
                    <TextField
                      name="app"
                      id="standard-full-width"
                      label="App"
                      onChange={this.handleInputChange}
                      placeholder="fashion_mnist_app"
                      helperText="Application Name"
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      name="task"
                      onChange={this.handleInputChange}
                      id="standard-full-width"
                      label="Task"
                      defaultValue="IMAGE_CLASSIFICATION"
                      placeholder="IMAGE_CLASSIFICATION"
                      fullWidth
                      disabled
                      margin="normal"
                    />
                    <FormControl fullWidth>
                      <InputLabel htmlFor="train_dataset">Training Datasets</InputLabel>
                      <Select
                        value={this.state.train_dataset}
                        onChange={this.handleInputChange}
                        input={<Input name="train_dataset" id="train_dataset" />}
                        fullWidth
                        defaultValue=""
                      >
                        <option value="" />
                        { availableDatasets.map( dataset => (<option value={dataset}> { dataset.name } </option>))}
                      </Select>
                      <FormHelperText>Datasets for Training</FormHelperText>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel htmlFor="val_dataset">Test Datasets</InputLabel>
                      <Select
                        value={this.state.val_dataset}
                        onChange={this.handleInputChange}
                        input={<Input name="val_dataset" id="val_dataset" />}
                        defaultValue=""
                        fullWidth
                      >
                        <option value="" />
                        { availableDatasets.map( dataset => (<option value={dataset}> { dataset.name } </option>))}
                      </Select>
                      <FormHelperText>Datasets for Validation</FormHelperText>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel htmlFor="model-multiple-checkbox">Models</InputLabel>
                      <Select
                        name="models"
                        multiple
                        value={this.state.models}
                        onChange={this.handleInputChange}
                        input={<Input id="model-multiple-checkbox" />}
                        renderValue={selected => (
                          <div>
                            {selected.map(value => (
                              <Chip key={value.id} label={value.name} />
                            ))}
                          </div>
                        )}
                      >
                        {this.state.availableModels.map(model => (
                          <MenuItem key={model.name} value={model}>
                            <Checkbox checked={this.state.models.indexOf(model) > -1} />
                            <ListItemText primary={model.name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>
                </GridContainer>
                <GridContainer justify="center" alignContent="center">
                  <GridItem xs={12} sm={12} md={12} lg={8} xl={6}>

                  </GridItem>
                </GridContainer>
              </CardBody>
              <CardFooter>
                {SubmitButton}
              </CardFooter>
            </Card>
          </GridItem>
        </GridContainer>
      </div>
    );
  }
}

export default withStyles(styles)(TrainJobs);
