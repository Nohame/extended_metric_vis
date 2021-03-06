import _ from 'lodash';
//import { AggResponseTabifyProvider } from 'ui/agg_response/tabify/tabify';
import { uiModules } from 'ui/modules';
const module = uiModules.get('kibana/extended_metric_vis', ['kibana']);

module.controller('KbnExtendedMetricVisController', function ($scope, Private) {
  //const tabifyAggResponse = Private(AggResponseTabifyProvider);
  const metrics = $scope.metrics = [];
  const calcOutputs = $scope.calcOutputs = [];

  function isInvalid(val) {
    return _.isUndefined(val) || _.isNull(val) || _.isNaN(val);
  }

  function updateOutputs() {
    $scope.vis.params.outputs.forEach(function (output) {

      let getPercetage = function(value, precision) {
          if (precision === 0) {
            return Math.round(value * 100);
          }

          if (precision > 0)  {
              const tbm = [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000, 100000000000, 1000000000000];
              return Math.round(value * tbm[precision-1])/(tbm[precision-1]/100);
          }
      };

      try {
        const func = Function("metrics", "return " + output.formula);
        const isPercentageMode = output.percentageMode;
        let value = func(metrics) || "?";
        if (isPercentageMode) {
          const percentage = getPercetage(value, output.precision);
          value = `${percentage}%`;
        }
        output.value = value;
      } catch (e) {
        output.value = '?';
      }
    });
  }

  $scope.processTableGroups = function (tableGroups) {
    tableGroups.tables.forEach(function (table) {
      table.columns.forEach(function (column, i) {
        const fieldFormatter = table.aggConfig(column).fieldFormatter();
        let value = table.rows[0][i];
        let formattedValue = isInvalid(value) ? '?' : fieldFormatter(value);

        const metric = {
          label: column.title,
          value: value,
          formattedValue: formattedValue
        };
        metrics.push(metric);
        metrics[column.title] = metric;
      });
    });

    updateOutputs();
  };

  // watches
  $scope.$watch('esResponse', function (resp) {
    if (resp) {
      calcOutputs.length = 0;
      metrics.length = 0;
      for (let key in metrics) {
        if (metrics.hasOwnProperty(key)) {
          delete metrics[key];
        }
      }
      $scope.$root.label_keys = [];
      $scope.processTableGroups(resp);
    }
  });

  $scope.$watchCollection('vis.params.outputs', updateOutputs);
});

module.controller('ExtendedMetricEditorController', function ($scope) {
  // Output Related Methods:
  $scope.addOutput = function (outputs) {
    outputs.push({
      formula: 'metrics[0].value * metrics[0].value',
      label: 'Count squared',
      enabled: true,
      percentageMode: false,
      precision: 0
    });
  };

  $scope.removeOuput = function (output, outputs) {
    if (outputs.length === 1) {
      return;
    }
    const index = outputs.indexOf(output);
    if (index >= 0) {
      outputs.splice(index, 1);
    }

    if (outputs.length === 1) {
      outputs[0].enabled = true;
    }
  };
});
