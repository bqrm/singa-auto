import os
import traceback
import datetime
import json
import logging

MODEL_LOG_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'

class LogType():
    PLOT = 'PLOT'
    METRICS = 'METRICS'
    MESSAGE = 'MESSAGE'

class ModelLogger():
    '''
    Allows models to log messages and metrics during model training, and 
    define plots for visualization of model training.

    To use this logger, import the global ``logger`` instance from the module ``rafiki.model``.

    For example:

    ::

        from rafiki.model import logger, BaseModel
        ...
        class MyModel(BaseModel):
            ...
            def train(self, dataset_uri):
                ...
                logger.log('Starting model training...')
                logger.define_plot('Precision & Recall', ['precision', 'recall'], x_axis='epoch')
                ...
                logger.log(precision=0.1, recall=0.6, epoch=1)
                ...
                logger.log('Ending model training...')
                ...

    '''
    
    def __init__(self):        
        # By default, set a logging handler to print to stdout (for debugging)
        logger = logging.getLogger(__name__)
        logger.setLevel(level=logging.INFO)
        logger.addHandler(ModelLoggerDebugHandler())
        self._logger = logger

    def define_loss_plot(self):
        '''
        Convenience method of defining a plot of ``loss`` against ``epoch``.
        To be used with :meth:`rafiki.model.ModelLogger.log_loss`.
        '''
        self.define_plot('Loss Over Epochs', ['loss'], x_axis='epoch')
  
    def log_loss(self, loss, epoch):
        '''
        Convenience method for logging `loss` against `epoch`.
        To be used with :meth:`rafiki.model.ModelLogger.define_loss_plot`.
        '''
        self.log(loss=loss, epoch=epoch)

    def define_plot(self, title, metrics, x_axis=None):
        '''
        Defines a plot for a set of metrics for analysis of model training.
        By default, metrics will be plotted against time.

        For example, a model's precision & recall logged with e.g. ``log(precision=0.1, recall=0.6, epoch=1)``
        can be visualized in the plots generated by
        ``define_plot('Precision & Recall', ['precision', 'recall'])`` (against time) or
        ``define_plot('Precision & Recall', ['precision', 'recall'], x_axis='epoch')`` (against epochs).

        Only call this method in :meth:`rafiki.model.BaseModel.train`.

        :param str title: Title of the plot
        :param metrics: List of metrics that should be plotted on the y-axis
        :type metrics: str[]
        :param str x_axis: Metric that should be plotted on the x-axis, against all other metrics. Defaults to ``'time'``, which is automatically logged
        '''
        self._log(LogType.PLOT, { 'title': title, 'metrics': metrics, 'x_axis': x_axis })

    def log(self, msg='', **metrics):
        '''
        Logs a message and/or a set of metrics at a single point in time.

        Logged messages will be viewable on Rafiki's administrative UI. 
        
        To visualize logged metrics on plots, a plot must be defined via :meth:`rafiki.model.ModelLogger.define_plot`.

        Only call this method in :meth:`rafiki.model.BaseModel.train` and :meth:`rafiki.model.BaseModel.evaluate`.

        :param str msg: Message to be logged
        :param metrics: Set of metrics & their values to be logged as ``{ <metric>: <value> }``, where ``<value>`` should be a number.
        :type metrics: dict[str, int|float]
        '''
        if msg:
            self._log(LogType.MESSAGE, { 'message': msg })
        
        if metrics:
            self._log(LogType.METRICS, metrics)
    
    # Set the Python logger internally used.
    # During model training, this method will be called by Rafiki to inject a Python logger 
    # to generate logs for an instance of model training.
    def set_logger(self, logger):
        self._logger = logger

    def _log(self, log_type, log_dict={}):
        log_dict['type'] = log_type
        log_dict['time'] = datetime.datetime.now().strftime(MODEL_LOG_DATETIME_FORMAT)
        log_line = json.dumps(log_dict)
        self._logger.info(log_line)

    @staticmethod
    # Parses a logged line into a dictionary.
    def parse_log_line(log_line):
        try:
            return json.loads(log_line)
        except ValueError:
            return {}

    @staticmethod
    # Parses logs into (messages, metrics, plots) for visualization.
    def parse_logs(log_lines):
        plots = []
        metrics = []
        messages = []

        for log_line in log_lines:
            log_dict = ModelLogger.parse_log_line(log_line)            

            if 'time' not in log_dict or 'type' not in log_dict:
                continue

            log_datetime = log_dict['time']
            log_type = log_dict['type']
            del log_dict['time']
            del log_dict['type']

            if log_type == LogType.MESSAGE:
                messages.append({
                    'time': log_datetime,
                    'message': log_dict.get('message')
                })

            elif log_type == LogType.METRICS:
                metrics.append({
                    'time': log_datetime,
                    **log_dict
                })

            elif log_type == LogType.PLOT:
                plots.append({
                    **log_dict
                })

        return (messages, metrics, plots)

class ModelLoggerDebugHandler(logging.Handler):
    def __init__(self):
        logging.Handler.__init__(self)

    def emit(self, record):
        log_line = record.msg
        log_dict = ModelLogger.parse_log_line(log_line)
        log_type = log_dict.get('type')

        if log_type == LogType.PLOT:

            title = log_dict.get('title')
            metrics = log_dict.get('metrics')
            x_axis = log_dict.get('x_axis')

            self._print('Plot `{}` of {} against {} will be registered when this model is being trained on Rafiki' \
                .format(title, ', '.join(metrics), x_axis or 'time'))

        elif log_type == LogType.METRICS:
            metrics_log = ', '.join(['{}={}'.format(metric, value) for (metric, value) in log_dict.items()])
            self._print('Metric(s) logged: {}'.format(metrics_log))

        elif log_type == LogType.MESSAGE:
            msg = log_dict.get('message')
            self._print(msg)

        else:
            self._print(log_line)
        
    def _print(self, message):
        print('[{}]'.format(__name__), message)

logger = ModelLogger()